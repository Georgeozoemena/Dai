import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface AccountState {
  currentAccountId: string | null;

  setCurrentAccount: (accountId: string) => void;

  clearCurrentAccount: () => void;
}

// SecureStore for native platforms, localStorage for web
const secureStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },

  setItem: async (name: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },

  removeItem: async (name: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      currentAccountId: null,

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
    }),

    {
      name: "dai-account-store",

      storage: createJSONStorage(
        () => secureStorage,
      ),
    },
  ),
);
