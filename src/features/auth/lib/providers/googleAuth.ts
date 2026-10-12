import Constants from 'expo-constants';
import { DeviceManager } from '../device/deviceManager';
import type {
  IAuthProvider,
  GoogleCredentials,
  AuthResult,
  AuthError
} from './types';

// Get both local and production URLs
const LOCAL_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  process.env.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  'http://localhost:5000';

const PRODUCTION_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  'https://dai-backend.onrender.com';

// Fallback order: Local first, then production
const API_URLS = [LOCAL_API_URL, PRODUCTION_API_URL];

console.log('🔍 [GoogleAuth] API URLs configured:');
console.log('  - Local:', LOCAL_API_URL);
console.log('  - Production:', PRODUCTION_API_URL);

/**
 * Try to reach backend with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 3000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try multiple backend URLs with fallback
 */
async function fetchWithFallback(
  endpoint: string,
  options: RequestInit
): Promise<{ response: Response; usedUrl: string }> {
  let lastError: Error | null = null;

  for (const baseUrl of API_URLS) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`[GoogleAuth] Trying backend: ${url}`);

    try {
      const response = await fetchWithTimeout(url, options, 3000);
      console.log(`[GoogleAuth] ✅ Connected to: ${baseUrl}`);
      return { response, usedUrl: baseUrl };
    } catch (error) {
      console.log(`[GoogleAuth] ❌ Failed to connect to ${baseUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      lastError = error instanceof Error ? error : new Error('Unknown error');
      // Continue to next URL
    }
  }

  // All URLs failed
  throw new Error(
    `Cannot reach backend. Tried:\n` +
    `1. Local: ${LOCAL_API_URL}\n` +
    `2. Production: ${PRODUCTION_API_URL}\n\n` +
    `Last error: ${lastError?.message || 'Unknown'}\n\n` +
    `Please check:\n` +
    `- Local backend is running (npm start in backend folder)\n` +
    `- OR production backend is online\n` +
    `- Network connection is active`
  );
}

/**
 * Google OAuth Authentication Provider
 * 
 * Authenticates users using Google ID tokens (OAuth 2.0)
 * Tries local backend first, falls back to production
 */
export class GoogleAuthProvider implements IAuthProvider<GoogleCredentials> {
  readonly provider = 'google' as const;

  /**
   * Authenticate user with Google ID token
   */
  async authenticate(credentials: GoogleCredentials): Promise<AuthResult> {
    try {
      const { idToken } = credentials;

      // Validate input
      if (!idToken) {
        throw this.createError('missing_id_token', 'Google ID token is required');
      }

      // Get device info for backend
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const requestBody = JSON.stringify({
        idToken,
        deviceHash: deviceInfo.deviceHash,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion
      });

      console.log('[GoogleAuth] Request body:', {
        idToken: idToken.substring(0, 20) + '...',
        deviceHash: deviceInfo.deviceHash,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion
      });

      // Try backends with fallback
      let response: Response;
      let usedUrl: string;
      
      try {
        const result = await fetchWithFallback('/api/v2/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody
        });
        response = result.response;
        usedUrl = result.usedUrl;
      } catch (fetchError) {
        console.error('[GoogleAuth] ❌ All backends failed:', fetchError);
        throw this.createError(
          'network_error',
          fetchError instanceof Error ? fetchError.message : 'Cannot reach backend servers'
        );
      }

      console.log('[GoogleAuth] Response status:', response.status);
      console.log('[GoogleAuth] Used backend:', usedUrl);
      
      const data = await response.json();
      console.log('[GoogleAuth] Response data:', data);

      // Handle errors
      if (!response.ok) {
        console.error('[GoogleAuth] Error response:', {
          status: response.status,
          code: data.code,
          message: data.message,
          fullResponse: data
        });
        throw this.createError(
          data.code || 'authentication_failed',
          data.message || 'Google authentication failed'
        );
      }

      // Validate response structure
      console.log('[GoogleAuth] Validating response structure...');
      console.log('[GoogleAuth] Has user:', !!data.user);
      console.log('[GoogleAuth] Has accessToken:', !!data.accessToken);
      console.log('[GoogleAuth] Has refreshToken:', !!data.refreshToken);
      
      if (!data.user || !data.accessToken || !data.refreshToken) {
        console.error('[GoogleAuth] Invalid response structure:', {
          hasUser: !!data.user,
          hasAccessToken: !!data.accessToken,
          hasRefreshToken: !!data.refreshToken,
          actualData: data
        });
        throw this.createError(
          'invalid_response',
          'Invalid response from authentication server'
        );
      }

      // Register device fingerprint (non-fatal - login can succeed even if this fails)
      try {
        await DeviceManager.registerDevice();
        console.log('[GoogleAuth] Device registered successfully');
      } catch (deviceError) {
        // Log the error but don't fail authentication
        console.warn('[GoogleAuth] Device registration failed (non-fatal):', deviceError);
      }

      console.log(`[GoogleAuth] ✅ Authentication successful using: ${usedUrl}`);

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceHash: deviceInfo.deviceHash,
        expiresIn: data.expiresIn || 900 // Default 15 minutes
      };
    } catch (error) {
      console.error('[GoogleAuth] Authentication failed:', error);
      
      if (this.isAuthError(error)) {
        throw error;
      }
      
      throw this.createError(
        'unknown_error',
        error instanceof Error ? error.message : 'Authentication failed'
      );
    }
  }

  /**
   * Check if Google auth is available
   */
  isAvailable(): boolean {
    const webClientId =
      Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    return Boolean(webClientId);
  }

  /**
   * Create standardized auth error
   */
  private createError(code: string, message: string): AuthError {
    return {
      code,
      message,
      provider: this.provider
    };
  }

  /**
   * Type guard for auth errors
   */
  private isAuthError(error: unknown): error is AuthError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

// Singleton instance
export const googleAuthProvider = new GoogleAuthProvider();
