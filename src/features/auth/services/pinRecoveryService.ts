import { env } from "../../../config/env";

const BACKEND_URL = env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface SendCodeResponse {
  message: string;
}

export interface VerifyCodeResponse {
  message: string;
  userId: string;
}

export interface ConfirmResetResponse {
  message: string;
}

/**
 * Send verification code to user's email
 */
export async function sendPinResetCode(email: string): Promise<SendCodeResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/pin-recovery/send-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to send code" }));
    throw new Error(error.message || "Failed to send verification code");
  }

  return response.json();
}

/**
 * Verify the 6-digit code
 */
export async function verifyPinResetCode(
  email: string,
  code: string,
): Promise<VerifyCodeResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/pin-recovery/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Invalid code" }));
    throw new Error(error.message || "Failed to verify code");
  }

  return response.json();
}

/**
 * Confirm PIN has been reset (cleanup backend token)
 */
export async function confirmPinReset(userId: string): Promise<ConfirmResetResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/pin-recovery/confirm-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to confirm" }));
    throw new Error(error.message || "Failed to confirm reset");
  }

  return response.json();
}
