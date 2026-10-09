import { useAuthStore } from "../../../store/auth/authStore";
import { trackLogoutAndFlush } from "../../../services/analytics/analyticsService";

/**
 * Logout user - clears tokens, unregisters device, and clears store
 * Now uses new auth system with Keychain and device management
 */
export async function logoutUser() {
  console.log("🔓 LOGOUT STARTED");
  
  try {
    // Record the logout and deliver queued analytics while the session
    // token is still valid.
    await trackLogoutAndFlush();

    // Clear authentication from store (this now clears Keychain + device)
    await useAuthStore.getState().clearAuth();
    console.log("✅ Auth cleared (Keychain + Device)");

    console.log("🔓 USER LOGGED OUT SUCCESSFULLY");
  } catch (error) {
    console.error("❌ LOGOUT ERROR:", error);
    throw error;
  }
}
