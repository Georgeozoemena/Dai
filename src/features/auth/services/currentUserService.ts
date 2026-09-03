import { getStoredAuth } from "./authStorage";

export async function getCurrentUserId(): Promise<string | null> {
  const auth = await getStoredAuth();

  if (!auth) {
    return null;
  }

  return auth.user.id;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("No authenticated user found");
  }

  return userId;
}
