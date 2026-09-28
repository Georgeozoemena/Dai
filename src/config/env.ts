import Constants from "expo-constants";

export const env = {
  EXPO_PUBLIC_BACKEND_URL:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    "http://localhost:5000",
  
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "",
};
