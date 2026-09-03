import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { getProfile } from "../../features/onboarding/services/profileService";
import { hasPin } from "../../features/auth/services/pinService";
import { getStoredAuth } from "../../features/auth/services/authStorage";
import { useAuthStore } from "../../store/auth/authStore";
import { colors, screenStyles } from "../../theme";

export default function BootstrapScreen() {
  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  useEffect(() => {
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

        // 2. Check this user's local profile
        const profile = await getProfile();

        if (!profile) {
          console.log("STATE → NEW USER");

          router.replace("/onboarding");
          return;
        }

        // 3. Check this user's PIN
        const pinExists = await hasPin(user.id);

        if (!pinExists) {
          console.log("STATE → PIN SETUP");

          router.replace("/pin-setup");
          return;
        }

        // 4. Existing user with PIN
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
