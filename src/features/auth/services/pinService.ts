import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const getPinKey = (userId: string) =>
  `dai_pin_${userId}`;

const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },

  async removeItem(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

export async function setPin(
  userId: string,
  pin: string,
) {
  await storage.setItem(
    getPinKey(userId),
    pin,
  );
}

export async function getPin(
  userId: string,
) {
  return storage.getItem(
    getPinKey(userId),
  );
}

export async function hasPin(
  userId: string,
) {
  const pin = await getPin(userId);

  return !!pin;
}

export async function verifyPin(
  userId: string,
  pin: string,
) {
  const storedPin = await getPin(userId);

  if (!storedPin) {
    return false;
  }

  return storedPin === pin;
}

export async function clearPin(
  userId: string,
) {
  await storage.removeItem(
    getPinKey(userId),
  );
}
