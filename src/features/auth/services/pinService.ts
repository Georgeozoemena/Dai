import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PIN_KEY = "dai_pin";

export async function setPin(pin: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(PIN_KEY, pin);
    return;
  }
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function getPin() {
  if (Platform.OS === "web") {
    return localStorage.getItem(PIN_KEY);
  }
  return SecureStore.getItemAsync(PIN_KEY);
}

export async function hasPin() {
  const pin = await getPin();

  return !!pin;
}

export async function verifyPin(pin: string) {
  const storedPin = await getPin();

  if (!storedPin) {
    return false;
  }

  return storedPin === pin;
}

export async function clearPin() {
  if (Platform.OS === "web") {
    localStorage.removeItem(PIN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(PIN_KEY);
}
