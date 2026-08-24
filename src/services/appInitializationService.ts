import { getProfile } from "../features/onboarding/services/profileService";
import { getAccounts } from "../features/accounts/services/accountService";
import { selectAccount } from "../features/accounts/services/accountSelectionService";

export async function initializeApp() {
  const profile = await getProfile();

  if (!profile) {
    return {
      status: "onboarding" as const,
    };
  }

  const accounts = await getAccounts(profile.id);

  if (accounts.length === 0) {
    return {
      status: "no-account" as const,
      profile,
    };
  }

  selectAccount(accounts[0]);

  return {
    status: "ready" as const,
    profile,
    account: accounts[0],
  };
}
