import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "dai_auth_token";
const AUTH_USER_KEY = "dai_auth_user";

// Platform-aware storage
const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export async function saveAuth(
  token: string,
  user: unknown,
) {
  await storage.setItem(
    AUTH_TOKEN_KEY,
    token,
  );

  await storage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user),
  );
}

export async function getStoredAuth() {
  const token = await storage.getItem(
    AUTH_TOKEN_KEY,
  );

  const userString = await storage.getItem(
    AUTH_USER_KEY,
  );

  if (!token || !userString) {
    return null;
  }

  return {
    token,
    user: JSON.parse(userString),
  };
}

export async function clearStoredAuth() {
  await storage.removeItem(AUTH_TOKEN_KEY);
  await storage.removeItem(AUTH_USER_KEY);
}
