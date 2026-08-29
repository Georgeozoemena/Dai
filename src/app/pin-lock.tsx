import { router } from "expo-router";

import { PinLockScreen } from "../features/auth/screens/PinLockScreen";
import { getProfile } from "../features/onboarding/services/profileService";
import { getAccounts } from "../features/accounts/services/accountService";
import { useAccountStore } from "../store/account/accountStore";

export default function PinLockRoute() {
  return (
    <PinLockScreen
      onSuccess={async () => {
        // After PIN is verified, check accounts
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

        const currentAccountId = useAccountStore.getState().currentAccountId;

        const selectedAccountExists = accounts.some(
          (account) => account.id === currentAccountId,
        );

        if (!selectedAccountExists) {
          useAccountStore.getState().setCurrentAccount(accounts[0].id);
        }

        router.replace("/(tabs)");
      }}
    />
  );
}

