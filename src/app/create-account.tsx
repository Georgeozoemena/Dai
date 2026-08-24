import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { CreateAccountScreen } from "../features/onboarding/screens/CreateAccountScreen";

import { selectAccount } from "../features/accounts/services/accountSelectionService";

export default function CreateAccountRoute() {
  const { profileId } =
    useLocalSearchParams<{
      profileId: string;
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

        // Continue to the main application.
        router.replace("/(tabs)");
      }}
    />
  );
}
