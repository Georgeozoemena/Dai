import { clearStoredAuth } from "./authStorage";
import { useAuthStore } from "../../../store/auth/authStore";

export async function logoutUser() {
  console.log("🔓 LOGOUT STARTED");
  
  try {
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
