import { useEffect } from "react";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

import { authenticateWithGoogle } from "../services/authService";
import { saveAuth } from "../services/authStorage";
import { useAuthStore } from "../../../store/auth/authStore";

WebBrowser.maybeCompleteAuthSession();

const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const redirectUri =
  AuthSession.makeRedirectUri();

console.log("GOOGLE REDIRECT URI:", redirectUri);

export function useGoogleAuth() {
  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId,
      redirectUri,
    });

  useEffect(() => {
    async function handleGoogleResponse() {
      if (response?.type !== "success") {
        return;
      }

      const idToken = response.params.id_token;

      if (!idToken) {
        console.error("Google did not return an ID token");
        return;
      }

      try {
        const data = await authenticateWithGoogle(idToken);

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
      }
    }

    handleGoogleResponse();
  }, [response, setAuth]);

  return {
    isReady: Boolean(request?.url),
    promptAsync,
  };
}
