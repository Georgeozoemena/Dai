import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { getProfile } from "../../features/onboarding/services/profileService";
import { hasPin } from "../../features/auth/services/pinService";
import { getStoredAuth } from "../../features/auth/services/authStorage";
import { useAuthStore } from "../../store/auth/authStore";
import { initializeAnalytics } from "../../services/analytics/analyticsService";
import { colors, screenStyles } from "../../theme";

export default function BootstrapScreen() {
  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  useEffect(() => {
    // Start product analytics first — token-gated and silent, so it
    // never affects the routing decisions below.
    initializeAnalytics();

    async function bootstrap() {
      try {
        console.log("========== BOOTSTRAP START ==========");

        // 1. Restore authentication
        const storedAuth = await getStoredAuth();

        if (!storedAuth) {
          console.log("STATE → UNAUTHENTICATED");

          router.replace("/login");
          return;
        }

        const { user, token } = storedAuth;

        setAuth(user, token);

        console.log(
          "STATE → AUTHENTICATED",
          user.email,
        );

        // 2. Check this user's local profile (auto-create if needed)
        let profile = await getProfile();

        if (!profile) {
          console.log("STATE → AUTO-CREATING PROFILE");

          // Auto-create profile from Google data
          const { createProfile } = await import("../../features/onboarding/services/profileService");
          
          // Generate a unique profile ID
          const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          profile = await createProfile({
            id: profileId,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          });

          console.log("PROFILE AUTO-CREATED:", profile.id);
        }

        // 3. Check this user's PIN
        const pinExists = await hasPin(user.id);

        if (!pinExists) {
          console.log("STATE → PIN SETUP");

          router.replace("/pin-setup");
          return;
        }

        // 4. Existing user with PIN → Go to lock screen
        console.log("STATE → LOCKED");

        router.replace("/pin-lock");
      } catch (error) {
        console.error("BOOTSTRAP FAILED:", error);

        // Never assume an error means a new user.
        router.replace("/login");
      }
    }

    bootstrap();
  }, [setAuth]);

  return (
    <View style={screenStyles.centered}>
      <ActivityIndicator size="large" color={colors.secondary} />
    </View>
  );
}
