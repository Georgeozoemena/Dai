import { clearStoredAuth } from "./authStorage";
import { useAuthStore } from "../../../store/auth/authStore";
import { trackLogoutAndFlush } from "../../../services/analytics/analyticsService";

export async function logoutUser() {
  console.log("🔓 LOGOUT STARTED");
  
  try {
    // Record the logout and deliver queued analytics while the session
    // token is still valid.
    await trackLogoutAndFlush();

    // Remove saved authentication
    await clearStoredAuth();
    console.log("✅ Storage cleared");

    // Clear authentication from memory
    useAuthStore.getState().clearAuth();
    console.log("✅ Auth store cleared");

    console.log("🔓 USER LOGGED OUT SUCCESSFULLY");
  } catch (error) {
    console.error("❌ LOGOUT ERROR:", error);
    throw error;
  }
}
