import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { CreateAccountScreen } from "../features/onboarding/screens/CreateAccountScreen";

import { selectAccount } from "../features/accounts/services/accountSelectionService";

export default function CreateAccountRoute() {
  const { profileId, returnTo } =
    useLocalSearchParams<{
      profileId: string;
      returnTo?: string;
    }>();

  if (!profileId) {
    return null;
  }

  return (
    <CreateAccountScreen
      profileId={profileId}
      onComplete={(account) => {
        // Make the newly created account
        // the currently selected account.
        selectAccount(account);

        // Navigate based on returnTo parameter
        // If coming from Accounts tab, go back there
        // Otherwise, continue to main application
        if (returnTo === "accounts") {
          router.replace("/(tabs)/accounts");
        } else {
          router.replace("/(tabs)");
        }
      }}
    />
  );
}
