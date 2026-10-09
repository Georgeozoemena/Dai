import { useEffect, useState, useRef } from "react";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

import { googleAuthProvider } from "../lib/providers";
import { tokenManager } from "../lib/tokens/tokenManager";
import { saveAuth } from "../services/authStorage";
import { useAuthStore } from "../../../store/auth/authStore";

WebBrowser.maybeCompleteAuthSession();

// Read from app config first so cloud builds never depend on local .env files.
const webClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const redirectUri = AuthSession.makeRedirectUri();

console.log("GOOGLE REDIRECT URI:", redirectUri);

export function useGoogleAuth() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Guard to prevent duplicate submissions
  const hasSubmitted = useRef(false);
  const lastResponseId = useRef<string | null>(null);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId,
      redirectUri,
    });

  useEffect(() => {
    async function handleGoogleResponse() {
      // Only process successful responses
      if (response?.type !== "success") {
        return;
      }

      const idToken = response.params.id_token;

      if (!idToken) {
        console.error("[GoogleAuth] No ID token received");
        return;
      }

      // Create unique ID for this response to prevent duplicate processing
      const responseId = `${response.type}_${idToken.substring(0, 20)}`;
      
      // Prevent duplicate submissions
      if (hasSubmitted.current || lastResponseId.current === responseId) {
        console.log("[GoogleAuth] Skipping duplicate response");
        return;
      }

      // Already processing
      if (isAuthenticating) {
        console.log("[GoogleAuth] Already authenticating, skipping");
        return;
      }

      // Mark as submitted
      hasSubmitted.current = true;
      lastResponseId.current = responseId;

      try {
        setIsAuthenticating(true);
        console.log("[GoogleAuth] Starting authentication...");

        // Authenticate using new provider
        const authResult = await googleAuthProvider.authenticate({
          provider: 'google',
          idToken
        });

        // Store tokens in Keychain
        await tokenManager.storeTokens({
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken
        });

        // Store auth in AsyncStorage (legacy compatibility)
        await saveAuth(
          authResult.accessToken,
          authResult.user,
        );

        // Update Zustand store
        setAuth(
          authResult.user,
          authResult.accessToken,
        );

        console.log("[GoogleAuth] ✅ User authenticated:", authResult.user.email);

        // Navigate to bootstrap
        router.replace("/bootstrap");
      } catch (error) {
        console.error("[GoogleAuth] ❌ Authentication failed:", error);
        // Reset guard on error to allow retry
        hasSubmitted.current = false;
        lastResponseId.current = null;
        // TODO: Show error toast/alert to user
      } finally {
        setIsAuthenticating(false);
      }
    }

    handleGoogleResponse();
  }, [response]); // Only depend on response, not isAuthenticating

  return {
    isReady: Boolean(request?.url) && !isAuthenticating,
    promptAsync,
    isAuthenticating,
  };
}
