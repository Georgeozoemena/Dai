import { useState } from 'react';
import { appleAuthProvider } from '../lib/providers';

interface UseAppleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  isAvailable: boolean;
  unavailableReason: string;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for Apple Sign-In authentication
 * 
 * PLACEHOLDER IMPLEMENTATION
 * Currently returns unavailable status until Apple Developer account is configured
 */
export function useAppleAuth(): UseAppleAuthReturn {
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sign in with Apple
   * Currently throws error - not yet configured
   */
  const signIn = async () => {
    setError('Apple Sign-In is not yet configured. Coming soon!');
    throw new Error('Apple Sign-In not available');
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  return {
    signIn,
    isLoading,
    isAvailable: appleAuthProvider.isAvailable(),
    unavailableReason: appleAuthProvider.getUnavailableReason(),
    error,
    clearError
  };
}

/**
 * Instructions for enabling Apple Sign-In:
 * 
 * 1. Get Apple Developer account ($99/year)
 * 2. Enable "Sign in with Apple" capability for your app
 * 3. Install: npm install expo-apple-authentication
 * 4. Configure app.json with "usesAppleSignIn": true
 * 5. Implement actual Apple Sign-In in appleAuth.ts provider
 * 6. Update this hook with real authentication logic
 * 7. Configure backend /api/auth/apple endpoint
 */
