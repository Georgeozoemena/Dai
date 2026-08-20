import { create } from "zustand";

interface AccountState {
  currentAccountId: string | null;

  setCurrentAccount: (accountId: string) => void;

  clearCurrentAccount: () => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  currentAccountId: null,
  // currentAccountId: "account-123",

  setCurrentAccount: (accountId) => {
    set({
      currentAccountId: accountId,
    });
  },

  clearCurrentAccount: () => {
    set({
      currentAccountId: null,
    });
  },
}));