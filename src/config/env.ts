import Constants from "expo-constants";

// Smart fallback system: try local first, then production
const LOCAL_BACKEND_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  process.env.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  "http://localhost:5000";

const PRODUCTION_BACKEND_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  "https://dai-backend.onrender.com";

export const env = {
  // Deprecated - use BACKEND_URL_LOCAL and BACKEND_URL_PRODUCTION
  EXPO_PUBLIC_BACKEND_URL: LOCAL_BACKEND_URL,
  
  // New fallback system
  EXPO_PUBLIC_BACKEND_URL_LOCAL: LOCAL_BACKEND_URL,
  EXPO_PUBLIC_BACKEND_URL_PRODUCTION: PRODUCTION_BACKEND_URL,
  
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "",
};
