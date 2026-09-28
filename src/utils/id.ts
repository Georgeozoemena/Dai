import * as Crypto from "expo-crypto";

// Hermes (React Native's JavaScript engine) does not provide the web Crypto
// API, so the global `crypto.randomUUID()` only works in browsers. expo-crypto
// uses the platform's secure random source on iOS/Android and the browser's
// Web Crypto API on web.
export function generateId(): string {
  return Crypto.randomUUID();
}
