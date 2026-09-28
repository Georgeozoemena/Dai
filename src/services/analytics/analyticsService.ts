import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

import { getStoredAuth } from "../../features/auth/services/authStorage";

const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const FLUSH_INTERVAL_MS = 30_000;
/** Flush early once this many events are queued. */
const FLUSH_EVENT_THRESHOLD = 50;
/** Upper bound on queued events; the oldest are dropped first. */
const MAX_QUEUE_SIZE = 200;
/** The backend accepts at most 50 events per batch. */
const MAX_BATCH_SIZE = 50;
/** Heartbeats (empty batches) mark the user as active at most this often. */
const HEARTBEAT_THROTTLE_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * The complete allowlist of product analytics events Dai sends.
 *
 * Kept in sync with EVENT_NAMES in the dai backend, which rejects any
 * other name. "signup", "login" and "advice_generated" are recorded by
 * the backend itself; the client never sends them.
 */
export const ANALYTICS_EVENT_NAMES = [
  "signup",
  "login",
  "logout",
  "account_created",
  "account_deleted",
  "account_switched",
  "expense_created",
  "income_created",
  "transaction_deleted",
  "budget_created",
  "budget_reached",
  "budget_exceeded",
  "goal_created",
  "goal_contribution",
  "report_generated",
  "coach_opened",
  "advice_generated",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

interface QueuedEvent {
  name: AnalyticsEventName;
  metadata?: Record<string, unknown>;
}

type BatchResult = "sent" | "retry" | "drop";

let queue: QueuedEvent[] = [];
let initialized = false;
let isFlushing = false;
let lastHeartbeatAt = 0;

/**
 * Record a product analytics event.
 *
 * Fire-and-forget: events are queued in memory and delivered in batches
 * to `POST /api/activity`, and this never throws into a financial flow.
 */
export function trackEvent(
  name: AnalyticsEventName,
  metadata?: Record<string, unknown>,
): void {
  try {
    queue.push({ name, metadata });

    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    if (queue.length >= FLUSH_EVENT_THRESHOLD) {
      void flushQueue();
    }
  } catch {
    // Analytics must never break the caller.
  }
}

/**
 * Start the analytics loop: periodic flushes, foreground/background
 * handling and an initial heartbeat. Safe to call more than once.
 *
 * Everything is token-gated — with no signed-in session nothing is sent
 * and events simply stay queued.
 */
export function initializeAnalytics(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  setInterval(() => {
    void flushOrHeartbeat();
  }, FLUSH_INTERVAL_MS);

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void flushOrHeartbeat();
    } else if (state === "background") {
      void flushQueue();
    }
  });

  // Mark this launch as an active session (throttled internally).
  void sendHeartbeat();
}

/**
 * Track the logout event and try to deliver the queue while the session
 * token is still valid — call before clearing stored auth. Never throws;
 * logout must always proceed.
 */
export async function trackLogoutAndFlush(): Promise<void> {
  try {
    trackEvent("logout");

    // Let any in-flight flush finish so this one sees the full queue.
    const deadline = Date.now() + 5000;

    while (isFlushing && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await flushQueue();

    // Anything undeliverable (e.g. offline) is dropped rather than left
    // to be attributed to whoever signs in on this device next.
    queue = [];
  } catch {
    // Silent by design.
  }
}

async function flushOrHeartbeat(): Promise<void> {
  if (queue.length > 0) {
    await flushQueue();
    return;
  }

  await sendHeartbeat();
}

async function flushQueue(): Promise<void> {
  if (isFlushing || queue.length === 0) {
    return;
  }

  isFlushing = true;

  try {
    const auth = await getStoredAuth();

    // Not signed in — keep events queued until there is a session.
    if (!auth) {
      return;
    }

    while (queue.length > 0) {
      const batch = queue.slice(0, MAX_BATCH_SIZE);
      const result = await sendBatch(batch, auth.token);

      if (result === "retry") {
        return;
      }

      queue = queue.slice(batch.length);
    }
  } catch {
    // Retried on the next flush window.
  } finally {
    isFlushing = false;
  }
}

/**
 * Send a heartbeat — an empty batch that refreshes the user's
 * lastActiveAt on the backend. Throttled so an open-but-idle app does
 * not hammer the API.
 */
async function sendHeartbeat(): Promise<void> {
  const now = Date.now();

  if (now - lastHeartbeatAt < HEARTBEAT_THROTTLE_MS) {
    return;
  }

  lastHeartbeatAt = now;

  try {
    const auth = await getStoredAuth();

    if (!auth) {
      return;
    }

    await sendBatch([], auth.token);
  } catch {
    // Silent by design.
  }
}

async function sendBatch(
  events: QueuedEvent[],
  token: string,
): Promise<BatchResult> {
  const appVersion = Constants.expoConfig?.version;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/api/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        events: events.map((event) =>
          event.metadata
            ? { name: event.name, metadata: event.metadata }
            : { name: event.name },
        ),
        platform: Platform.OS,
        ...(appVersion ? { appVersion } : {}),
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      return "sent";
    }

    // A rejected payload or session will never succeed on retry — drop
    // the batch. Anything else (rate limit, route missing on an older
    // backend, server error) is worth another attempt later.
    if (response.status === 400 || response.status === 401) {
      return "drop";
    }

    return "retry";
  } catch {
    return "retry";
  } finally {
    clearTimeout(timeout);
  }
}
