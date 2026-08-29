import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { getProfile } from "../../features/onboarding/services/profileService";
import { getAccounts } from "../../features/accounts/services/accountService";
import { useAccountStore } from "../../store/account/accountStore";
import { hasPin } from "../../features/auth/services/pinService";

export default function BootstrapScreen() {
  const currentAccountId = useAccountStore(
    (state) => state.currentAccountId,
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        console.log("========== BOOTSTRAP START ==========");

        const profile = await getProfile();

        console.log("PROFILE:", profile);

        if (!profile) {
          console.log("NO PROFILE → ONBOARDING");
          router.replace("/onboarding");
          return;
        }

        // Check if PIN exists
        const pinExists = await hasPin();

        console.log("PIN EXISTS:", pinExists);

        if (!pinExists) {
          console.log("NO PIN → PIN SETUP");
          router.replace("/pin-setup");
          return;
        }

        // PIN exists, show PIN lock screen
        console.log("PIN EXISTS → PIN LOCK");
        router.replace("/pin-lock");
      } catch (error) {
        console.error("BOOTSTRAP FAILED:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // If database error, try to continue to onboarding
        router.replace("/onboarding");
      }
    }

    bootstrap();
  }, [currentAccountId]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
