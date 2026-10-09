import { useState } from 'react';
import { router } from 'expo-router';
import { phoneAuthProvider } from '../lib/providers';
import { tokenManager } from '../lib/tokens/tokenManager';
import { saveAuth } from '../services/authStorage';
import { useAuthStore } from '../../../store/auth/authStore';
import type { AuthError } from '../lib/providers/types';

interface UsePhoneAuthReturn {
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  verificationId: string | null;
  expiresIn: number | null;
}

/**
 * Hook for Phone/OTP authentication
 * 
 * Two-step process:
 * 1. Request OTP to be sent to phone number
 * 2. Verify OTP code to complete authentication
 */
export function usePhoneAuth(): UsePhoneAuthReturn {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  /**
   * Request OTP to be sent to phone number
   * Returns true if successful
   */
  const requestOtp = async (phone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request OTP from backend
      const result = await phoneAuthProvider.requestOtp(phone);

      if (!result.success) {
        setError(result.error || 'Failed to send OTP');
        return false;
      }

      // Store verification ID and expiry
      setVerificationId(result.verificationId || null);
      setExpiresIn(result.expiresIn || null);

      console.log('[PhoneAuth] OTP sent successfully');
      return true;
    } catch (err) {
      console.error('[PhoneAuth] OTP request failed:', err);
      setError('Failed to send OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP code and complete authentication
   */
  const verifyOtp = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Authenticate using phone provider
      const authResult = await phoneAuthProvider.authenticate({
        provider: 'phone',
        phone,
        verificationCode: code
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

      console.log('[PhoneAuth] User authenticated:', authResult.user.phone);

      // Clear verification state
      setVerificationId(null);
      setExpiresIn(null);

      // Navigate to bootstrap
      router.replace('/bootstrap');
    } catch (err) {
      console.error('[PhoneAuth] Verification failed:', err);
      
      const authError = err as AuthError;
      
      // Provide user-friendly error messages
      if (authError.code === 'invalid_code') {
        setError('Invalid or expired verification code');
      } else {
        setError(authError.message || 'Verification failed. Please try again.');
      }
      
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
    requestOtp,
    verifyOtp,
    isLoading,
    error,
    clearError,
    verificationId,
    expiresIn
  };
}

/**
 * Utility function to format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  return phoneAuthProvider.formatPhoneNumber(phone);
}

/**
 * Utility function to get country code from phone number
 */
export function getCountryCode(phone: string): string | undefined {
  return phoneAuthProvider.getCountryCode(phone);
}
