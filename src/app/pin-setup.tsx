import { router } from "expo-router";

import { PinSetupScreen } from "../features/auth/screens/PinSetupScreen";
import { getProfile } from "../features/onboarding/services/profileService";
import { getAccounts } from "../features/accounts/services/accountService";

export default function PinSetupRoute() {
  return (
    <PinSetupScreen
      onComplete={async () => {
        // After PIN is created, check if user needs to create account
        const profile = await getProfile();

        if (!profile) {
          router.replace("/onboarding");
          return;
        }

        const accounts = await getAccounts(profile.id);

        if (accounts.length === 0) {
          router.replace({
            pathname: "/create-account",
            params: { profileId: profile.id },
          });
          return;
        }

        router.replace("/(tabs)");
      }}
    />
  );
}

