import Constants from 'expo-constants';
import { DeviceManager } from '../device/deviceManager';
import type {
  IAuthProvider,
  AppleCredentials,
  AuthResult,
  AuthError
} from './types';

const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://dai-backend.onrender.com';

/**
 * Apple Sign-In Authentication Provider
 * 
 * PLACEHOLDER IMPLEMENTATION
 * Requires Apple Developer account and configuration
 * Currently returns error when called
 */
export class AppleAuthProvider implements IAuthProvider<AppleCredentials> {
  readonly provider = 'apple' as const;

  /**
   * Authenticate user with Apple ID token
   * 
   * @throws {AuthError} Always throws - not yet configured
   */
  async authenticate(credentials: AppleCredentials): Promise<AuthResult> {
    try {
      const { identityToken, authorizationCode, user } = credentials;

      // Validate input
      if (!identityToken) {
        throw this.createError('missing_id_token', 'Apple identity token is required');
      }

      // Get device info
      const deviceInfo = await DeviceManager.getDeviceInfo();

      // Call backend authentication endpoint
      const response = await fetch(`${API_URL}/api/v2/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken,
          authorizationCode,
          user: user ? {
            email: user.email,
            firstName: user.name?.firstName,
            lastName: user.name?.lastName
          } : undefined,
          deviceHash: deviceInfo.deviceHash,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion
        })
      });

      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        throw this.createError(
          data.code || 'authentication_failed',
          data.message || 'Apple authentication failed'
        );
      }

      // Validate response
      if (!data.user || !data.accessToken || !data.refreshToken) {
        throw this.createError(
          'invalid_response',
          'Invalid response from authentication server'
        );
      }

      // Register device
      await DeviceManager.registerDevice();

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceHash: deviceInfo.deviceHash,
        expiresIn: data.expiresIn || 900
      };
    } catch (error) {
      console.error('[AppleAuth] Authentication failed:', error);
      
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
   * Check if Apple Sign-In is available
   * 
   * Currently returns false until Apple Developer account is set up
   */
  isAvailable(): boolean {
    // TODO: Check for Apple Developer account configuration
    // For now, always return false (placeholder)
    return false;
  }

  /**
   * Get reason why Apple Sign-In is unavailable
   */
  getUnavailableReason(): string {
    return 'Apple Developer account not configured. Sign-In with Apple is coming soon!';
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
export const appleAuthProvider = new AppleAuthProvider();

/**
 * Configuration instructions for Apple Sign-In
 * 
 * To enable Apple Sign-In:
 * 
 * 1. Create Apple Developer Account ($99/year)
 *    https://developer.apple.com/programs/
 * 
 * 2. Enable "Sign in with Apple" capability
 *    - Go to Certificates, Identifiers & Profiles
 *    - Select your App ID
 *    - Enable "Sign in with Apple"
 * 
 * 3. Install dependencies:
 *    npm install expo-apple-authentication
 * 
 * 4. Configure app.json:
 *    {
 *      "ios": {
 *        "usesAppleSignIn": true
 *      }
 *    }
 * 
 * 5. Update this file to:
 *    - Import expo-apple-authentication
 *    - Implement actual Sign-In logic
 *    - Update isAvailable() to return true
 * 
 * 6. Backend configuration:
 *    - Register Service ID with Apple
 *    - Configure redirect URLs
 *    - Implement /api/auth/apple endpoint
 */
