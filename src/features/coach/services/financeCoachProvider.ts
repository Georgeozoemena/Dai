import Constants from "expo-constants";

import type {
  FinanceCoachContext,
  FinanceCoachResponse,
} from "../types";

import { authClient } from "../../auth/lib/authClient";

const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

console.log("🔍 API_URL configured as:", API_URL);

const REQUEST_TIMEOUT_MS = 20000;

export type FinanceCoachErrorKind =
  | "offline"
  | "timeout"
  | "server"
  | "malformed";

export class FinanceCoachError extends Error {
  kind: FinanceCoachErrorKind;

  constructor(kind: FinanceCoachErrorKind, message: string) {
    super(message);
    this.name = "FinanceCoachError";
    this.kind = kind;
  }
}

/**
 * Provider abstraction for Dai Coach advice.
 *
 * The rest of the app depends only on this interface, so the AI model or
 * provider behind it can change without touching any UI code. The API key
 * lives on the Dai backend — never in this client.
 */
export interface FinanceCoachProvider {
  generateAdvice(context: FinanceCoachContext): Promise<FinanceCoachResponse>;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function parseCoachResponse(data: unknown): FinanceCoachResponse {
  if (typeof data !== "object" || data === null) {
    throw new FinanceCoachError(
      "malformed",
      "Dai Coach returned an unexpected response.",
    );
  }

  const record = data as Record<string, unknown>;
  const advice = record.advice;

  if (typeof advice !== "object" || advice === null) {
    throw new FinanceCoachError(
      "malformed",
      "Dai Coach returned an unexpected response.",
    );
  }

  const adviceRecord = advice as Record<string, unknown>;

  const { whatWentWell, needsAttention, suggestions } = adviceRecord;

  if (
    !isStringArray(whatWentWell) ||
    !isStringArray(needsAttention) ||
    !isStringArray(suggestions)
  ) {
    throw new FinanceCoachError(
      "malformed",
      "Dai Coach returned an unexpected response.",
    );
  }

  return {
    advice: { whatWentWell, needsAttention, suggestions },
    generatedAt:
      typeof record.generatedAt === "string"
        ? record.generatedAt
        : new Date().toISOString(),
    provider:
      typeof record.provider === "string" ? record.provider : "dai-backend",
  };
}

/**
 * Backend contract (implemented in the Dai backend repository, which owns
 * the AI provider secret):
 *
 *   POST {EXPO_PUBLIC_BACKEND_URL}/api/coach/advice
 *   Auth: Bearer <dai_auth_token> (the stored session JWT)
 *   Body: { context: FinanceCoachContext }
 *
 *   200 → { advice: { whatWentWell: string[], needsAttention: string[],
 *                     suggestions: string[] },
 *           generatedAt?: string, provider?: string }
 *   4xx/5xx → { message?: string }
 *
 * The backend should instruct the model to act as a practical budgeting
 * coach: concise, contextual, non-judgmental, no certainty about the
 * user's financial future, and no investment/tax/legal/lending advice.
 */
class BackendFinanceCoachProvider implements FinanceCoachProvider {
  async generateAdvice(
    context: FinanceCoachContext,
  ): Promise<FinanceCoachResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    let response: Response;

    console.log("🔍 DEBUG: Calling API:", `${API_URL}/api/coach/advice`);
    console.log("🔍 DEBUG: Context:", JSON.stringify(context).substring(0, 200));

    try {
      // Use authClient for automatic token handling and 401 refresh
      response = await authClient.post('/coach/advice', { context });
      
      console.log("🔍 DEBUG: Response status:", response.status);
      console.log("🔍 DEBUG: Response ok:", response.ok);
    } catch (error) {
      console.error("🔍 DEBUG: Fetch error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new FinanceCoachError(
          "timeout",
          "Dai Coach took too long to respond. Please try again.",
        );
      }

      throw new FinanceCoachError(
        "offline",
        "Couldn't reach Dai Coach. Personalised advice needs an internet connection.",
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new FinanceCoachError(
        "server",
        `Dai Coach is unavailable right now (${response.status}).`,
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      throw new FinanceCoachError(
        "malformed",
        "Dai Coach returned an unexpected response.",
      );
    }

    return parseCoachResponse(data);
  }
}

export const financeCoachProvider: FinanceCoachProvider =
  new BackendFinanceCoachProvider();
