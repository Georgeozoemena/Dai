import { deleteDatabase } from "../client/database";
import {
  clearStoredAuth,
  getStoredAuth,
} from "../../features/auth/services/authStorage";
import { clearPin } from "../../features/auth/services/pinService";

// Wipes on-device data: the SQLite database file, the stored
// session, and the user's PIN.
export async function resetDatabase(): Promise<void> {
  const auth = await getStoredAuth();

  if (auth?.user?.id) {
    await clearPin(auth.user.id);
  }

  await clearStoredAuth();

  await deleteDatabase();
}
