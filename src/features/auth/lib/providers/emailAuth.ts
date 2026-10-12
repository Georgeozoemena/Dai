import Constants from 'expo-constants';
import { DeviceManager } from '../device/deviceManager';
import type {
  IEmailAuthProvider,
  EmailCredentials,
  AuthResult,
  AuthError
} from './types';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

console.log('🔍 API_URL configured as:', API_URL);

/**
 * Email/Password Authentication Provider
 * 
 * Authenticates users using email and password
 * Supports both login and signup
 */
export class EmailAuthProvider implements IEmailAuthProvider {
  readonly provider = 'email' as const;

  /**
   * Authenticate user with email/password (login)
   */
  async authenticate(credentials: EmailCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        throw this.createError('missing_credentials', 'Email and password are required');
      }

      if (!this.isValidEmail(email)) {
        throw this.createError('invalid_email', 'Invalid email format');
      }

      // Get device info
      const deviceInfo = await DeviceManager.getDeviceInfo();

      // Call backend login endpoint
      console.log('[EmailAuth] Calling login endpoint:', `${API_URL}/api/v2/auth/email/login`);
      
      const response = await fetch(`${API_URL}/api/v2/auth/email/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          deviceHash: deviceInfo.deviceHash,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion
        })
      });

      console.log('[EmailAuth] Response status:', response.status);
      
      const data = await response.json();
      console.log('[EmailAuth] Response data:', data);

      // Handle errors
      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Email authentication failed';
        const errorCode = data.code || (response.status === 404 ? 'endpoint_not_found' : 'authentication_failed');
        
        console.error('[EmailAuth] Login error:', {
          status: response.status,
          code: errorCode,
          message: errorMsg,
          fullResponse: data
        });
        
        throw this.createError(errorCode, errorMsg);
      }

      // Validate response
      if (!data.user || !data.accessToken || !data.refreshToken) {
        throw this.createError(
          'invalid_response',
          'Invalid response from authentication server'
        );
      }

      // Register device (non-fatal - login can succeed even if this fails)
      try {
        await DeviceManager.registerDevice();
        console.log('[EmailAuth] Device registered successfully');
      } catch (deviceError) {
        // Log the error but don't fail authentication
        console.warn('[EmailAuth] Device registration failed (non-fatal):', deviceError);
      }

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceHash: deviceInfo.deviceHash,
        expiresIn: data.expiresIn || 900
      };
    } catch (error) {
      console.error('[EmailAuth] Authentication failed:', error);
      
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
   * Sign up new user with email/password
   * 
   * Note: This creates a new account. For account linking scenarios,
   * the frontend should check for conflicts using identityResolver first
   * and handle linking flow if needed.
   */
  async signup(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      // Validate input
      if (!email || !password) {
        throw this.createError('missing_credentials', 'Email and password are required');
      }

      if (!this.isValidEmail(email)) {
        throw this.createError('invalid_email', 'Invalid email format');
      }

      if (!this.isStrongPassword(password)) {
        throw this.createError(
          'weak_password',
          'Password must be at least 8 characters with uppercase, lowercase, and numbers'
        );
      }

      // Get device info
      const deviceInfo = await DeviceManager.getDeviceInfo();

      // Call backend signup endpoint
      console.log('[EmailAuth] Calling signup endpoint:', `${API_URL}/api/v2/auth/email/signup`);
      
      const response = await fetch(`${API_URL}/api/v2/auth/email/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          deviceHash: deviceInfo.deviceHash,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion
        })
      });

      console.log('[EmailAuth] Response status:', response.status);
      
      const data = await response.json();
      console.log('[EmailAuth] Response data:', data);

      // Handle errors
      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Email signup failed';
        const errorCode = data.code || (response.status === 404 ? 'endpoint_not_found' : 'signup_failed');
        
        console.error('[EmailAuth] Signup error:', {
          status: response.status,
          code: errorCode,
          message: errorMsg,
          fullResponse: data
        });
        
        throw this.createError(errorCode, errorMsg);
      }

      // Validate response
      if (!data.user || !data.accessToken || !data.refreshToken) {
        throw this.createError(
          'invalid_response',
          'Invalid response from authentication server'
        );
      }

      // Register device (non-fatal - login can succeed even if this fails)
      try {
        await DeviceManager.registerDevice();
        console.log('[EmailAuth] Device registered successfully');
      } catch (deviceError) {
        // Log the error but don't fail authentication
        console.warn('[EmailAuth] Device registration failed (non-fatal):', deviceError);
      }

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceHash: deviceInfo.deviceHash,
        expiresIn: data.expiresIn || 900
      };
    } catch (error) {
      console.error('[EmailAuth] Signup failed:', error);
      
      if (this.isAuthError(error)) {
        throw error;
      }
      
      throw this.createError(
        'unknown_error',
        error instanceof Error ? error.message : 'Signup failed'
      );
    }
  }

  /**
   * Check if email auth is available
   */
  isAvailable(): boolean {
    // Email auth is always available (no special config needed)
    return true;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check password strength
   * Minimum 8 characters, at least one uppercase, one lowercase, and one number
   */
  private isStrongPassword(password: string): boolean {
    if (password.length < 8) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber;
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
export const emailAuthProvider = new EmailAuthProvider();
