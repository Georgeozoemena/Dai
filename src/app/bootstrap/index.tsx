import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { getProfile } from "../../features/onboarding/services/profileService";
import { hasPin } from "../../features/auth/services/pinService";
import { tokenManager } from "../../features/auth/lib/tokens/tokenManager";
import { DeviceManager } from "../../features/auth/lib/device/deviceManager";
import { useAuthStore } from "../../store/auth/authStore";
import { useAccountStore } from "../../store/account/accountStore";
import { initializeAnalytics } from "../../services/analytics/analyticsService";
import { colors, screenStyles } from "../../theme";

// In-flight guard to prevent duplicate bootstrap runs
let bootstrapInProgress = false;

export default function BootstrapScreen() {
  const { user } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent duplicate runs in strict mode or hot reload
    if (hasRun.current || bootstrapInProgress) {
      console.log("⚠️ Bootstrap already running, skipping duplicate");
      return;
    }

    hasRun.current = true;
    bootstrapInProgress = true;

    // Start product analytics first — token-gated and silent, so it
    // never affects the routing decisions below.
    initializeAnalytics();

    async function bootstrap() {
      try {
        console.log("========== BOOTSTRAP START ==========");

        // 1. Check in-memory auth store first (fastest)
        console.log("📦 Checking in-memory auth store...");
        console.log("   User in store:", user ? `${user.email || user.phone} (${user.id})` : "null");

        // 2. Check for stored tokens (Keychain/LocalStorage)
        console.log("🔑 Checking stored tokens...");
        const accessToken = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();

        console.log("   Access token:", accessToken ? `${accessToken.substring(0, 20)}...` : "null");
        console.log("   Refresh token:", refreshToken ? `${refreshToken.substring(0, 20)}...` : "null");

        if (!accessToken || !refreshToken) {
          console.log("STATE → UNAUTHENTICATED (No tokens)");
          router.replace("/auth");
          return;
        }

        // 3. Validate device registration (non-fatal on web/development)
        console.log("📱 Checking device registration...");
        try {
          const deviceStatus = await DeviceManager.getDeviceStatus();
          
          if (deviceStatus.needsReregistration) {
            console.warn("⚠️ Device needs reregistration:", deviceStatus.changeReason);
            // Don't block login for device registration issues
            // The device will be re-registered on next successful auth
          }
        } catch (deviceError) {
          console.warn("⚠️ Device validation failed (non-fatal):", deviceError);
          // Continue with bootstrap
        }

        // 4. Restore user from store (should be persisted via zustand)
        if (!user) {
          console.log("STATE → NO USER DATA");
          console.log("⚠️ Tokens exist but user data missing - storage may not be hydrated yet");
          
          // Wait a bit for zustand persist to hydrate
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check again after hydration delay
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            console.log("❌ User data still missing after hydration wait");
            console.log("   This likely means the user logged in but store wasn't persisted");
            console.log("   Clearing tokens and requiring re-authentication");
            await tokenManager.clearTokens();
            router.replace("/auth");
            return;
          }
          
          console.log("✅ User data hydrated:", currentUser.email || currentUser.phone);
        }

        const currentUser = user || useAuthStore.getState().user;
        
        if (!currentUser) {
          console.log("❌ Fatal: No user data available");
          await tokenManager.clearTokens();
          router.replace("/auth");
          return;
        }

        console.log("STATE → AUTHENTICATED", currentUser.email || currentUser.phone);

        // 5. Check this user's local profile (auto-create if needed)
        let profile = await getProfile();

        if (!profile) {
          console.log("STATE → AUTO-CREATING PROFILE");

          // Auto-create profile from auth data
          const { createProfile } = await import("../../features/onboarding/services/profileService");
          
          // Generate a unique profile ID
          const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          profile = await createProfile({
            id: profileId,
            name: currentUser.name || 'User',
            email: currentUser.email,
            avatar: currentUser.avatar,
          });

          console.log("PROFILE AUTO-CREATED:", profile.id);
        }

        // 5.5. Auto-create default account if none exists
        const { getAccounts } = await import("../../features/accounts/services/accountService");
        const { createAccount } = await import("../../features/accounts/services/accountService");
        const existingAccounts = await getAccounts(profile.id);

        if (existingAccounts.length === 0) {
          console.log("STATE → AUTO-CREATING DEFAULT ACCOUNT");
          
          const { generateId } = await import("../../utils/id");
          const now = new Date().toISOString();
          
          const defaultAccount = await createAccount({
            id: generateId(),
            profileId: profile.id,
            name: "My Account",
            initialBalance: 0,
            currencyCode: "NGN",
            createdAt: now,
            updatedAt: now,
          });

          console.log("DEFAULT ACCOUNT CREATED:", defaultAccount.id);
          
          // Select this account as the current account
          const { selectAccount } = await import("../../features/accounts/services/accountSelectionService");
          selectAccount(defaultAccount);
        } else if (existingAccounts.length > 0) {
          // Ensure an account is selected if not already
          const { selectAccount } = await import("../../features/accounts/services/accountSelectionService");
          const currentAccountId = useAccountStore.getState().currentAccountId;
          
          if (!currentAccountId) {
            console.log("STATE → SELECTING FIRST ACCOUNT");
            selectAccount(existingAccounts[0]);
          }
        }

        // 6. Check this user's PIN
        const pinExists = await hasPin(currentUser.id);

        if (!pinExists) {
          console.log("STATE → PIN SETUP");
          router.replace("/pin-setup");
          return;
        }

        // 7. Existing user with PIN → Go to lock screen
        console.log("STATE → LOCKED");
        router.replace("/pin-lock");
      } catch (error) {
        console.error("BOOTSTRAP FAILED:", error);

        // Only clear tokens on authentication errors (401, invalid token)
        // Don't clear on network errors or other transient failures
        const isAuthError = 
          error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('invalid') || 
           error.message.includes('expired'));

        if (isAuthError) {
          console.log("🔒 Authentication error detected, clearing tokens");
          await tokenManager.clearTokens();
        } else {
          console.warn("⚠️ Non-auth error, retaining tokens for retry");
        }

        router.replace("/auth");
      } finally {
        bootstrapInProgress = false;
        console.log("========== BOOTSTRAP END ==========\n");
      }
    }

    bootstrap();
  }, []); // Empty deps - only run once per mount

  return (
    <View style={screenStyles.centered}>
      <ActivityIndicator size="large" color={colors.secondary} />
    </View>
  );
}
