import { useState } from 'react';
import { router } from 'expo-router';
import { emailAuthProvider } from '../lib/providers';
import { tokenManager } from '../lib/tokens/tokenManager';
import { saveAuth } from '../services/authStorage';
import { useAuthStore } from '../../../store/auth/authStore';
import type { AuthError } from '../lib/providers/types';

interface UseEmailAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for Email/Password authentication
 * 
 * Provides login and signup functionality
 */
export function useEmailAuth(): UseEmailAuthReturn {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login with email/password
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Authenticate using email provider
      const authResult = await emailAuthProvider.authenticate({
        provider: 'email',
        email,
        password
      });

      // Store tokens in Keychain
      await tokenManager.storeTokens({
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      });

      // Store auth in AsyncStorage (legacy compatibility)
      await saveAuth(authResult.accessToken, authResult.user);

      // Update Zustand store
      setAuth(authResult.user, authResult.accessToken);

      console.log('[EmailAuth] User logged in:', authResult.user.email);

      // Navigate to bootstrap
      router.replace('/bootstrap');
    } catch (err) {
      console.error('[EmailAuth] Login failed:', err);
      
      const authError = err as AuthError;
      setError(authError.message || 'Login failed. Please try again.');
      
      throw err; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email/password
   */
  const signup = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign up using email provider
      const authResult = await emailAuthProvider.signup(email, password, name);

      // Store tokens in Keychain
      await tokenManager.storeTokens({
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      });

      // Store auth in AsyncStorage (legacy compatibility)
      await saveAuth(authResult.accessToken, authResult.user);

      // Update Zustand store
      setAuth(authResult.user, authResult.accessToken);

      console.log('[EmailAuth] User signed up:', authResult.user.email);

      // Navigate to email verification (email needs to be verified before PIN setup)
      router.replace({
        pathname: '/auth/email-verify',
        params: {
          email: authResult.user.email || email,
          userId: authResult.user.id,
        },
      });
    } catch (err) {
      console.error('[EmailAuth] Signup failed:', err);
      
      const authError = err as AuthError;
      setError(authError.message || 'Signup failed. Please try again.');
      
      throw err; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  return {
    login,
    signup,
    isLoading,
    error,
    clearError
  };
}
