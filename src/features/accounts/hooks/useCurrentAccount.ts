import { useAccountStore } from "../../../store/account/accountStore";

export function useCurrentAccount() {
  const currentAccountId =
    useAccountStore(
      (state) => state.currentAccountId,
    );

  return {
    currentAccountId,
  };
}