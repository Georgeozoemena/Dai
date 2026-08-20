import type { Account } from "../../../types/account";
import { useAccountStore } from "../../../store/account/accountStore";

export function selectAccount(account: Account) {
  useAccountStore
    .getState()
    .setCurrentAccount(account.id);
}

export function clearSelectedAccount() {
  useAccountStore
    .getState()
    .clearCurrentAccount();
}

export function getSelectedAccountId() {
  return useAccountStore
    .getState()
    .currentAccountId;
}