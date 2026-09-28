import { useEffect, useState } from "react";
import { router } from "expo-router";
import Constants from "expo-constants";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { authenticateWithGoogle } from "../services/authService";
import { saveAuth } from "../services/authStorage";
import { useAuthStore } from "../../../store/auth/authStore";

// Read from app config first so cloud builds never depend on local .env files.
const webClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function useGoogleAuth() {
  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const [signingIn, setSigningIn] =
    useState(false);

  useEffect(() => {
    if (!webClientId) {
      console.error(
        "GOOGLE AUTH CONFIG ERROR: Web client ID is missing",
      );
      return;
    }

    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
  }, []);

  async function promptAsync() {
    if (signingIn) {
      return;
    }

    if (!webClientId) {
      console.error(
        "GOOGLE AUTH FAILED: Web client ID is missing",
      );
      return;
    }

    setSigningIn(true);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        console.log("GOOGLE SIGN-IN CANCELLED");
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        console.error(
          "Google did not return an ID token",
        );
        return;
      }

      const data =
        await authenticateWithGoogle(idToken);

      await saveAuth(
        data.token,
        data.user,
      );

      setAuth(
        data.user,
        data.token,
      );

      console.log("DAI USER AUTHENTICATED:", data.user);

      router.replace("/bootstrap");
    } catch (error) {
      console.error("GOOGLE AUTH FAILED:", error);
    } finally {
      setSigningIn(false);
    }
  }

  return {
    isReady: !signingIn,
    promptAsync,
  };
}
