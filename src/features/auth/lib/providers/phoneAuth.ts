import Constants from 'expo-constants';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { DeviceManager } from '../device/deviceManager';
import type {
  IPhoneAuthProvider,
  PhoneCredentials,
  AuthResult,
  OtpResult,
  AuthError
} from './types';

const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://dai-backend.onrender.com';

/**
 * Phone/OTP Authentication Provider
 * 
 * Two-step authentication:
 * 1. Request OTP to be sent to phone number
 * 2. Verify OTP code to complete authentication
 */
export class PhoneAuthProvider implements IPhoneAuthProvider {
  readonly provider = 'phone' as const;

  /**
   * Request OTP to be sent to phone number
   */
  async requestOtp(phone: string): Promise<OtpResult> {
    try {
      // Validate phone number
      if (!phone) {
        return {
          success: false,
          error: 'Phone number is required'
        };
      }

      // Parse and validate phone number format
      if (!isValidPhoneNumber(phone)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Parse to E.164 format (+1234567890)
      const phoneNumber = parsePhoneNumber(phone);
      const e164Phone = phoneNumber?.number;

      if (!e164Phone) {
        return {
          success: false,
          error: 'Could not parse phone number'
        };
      }

      // Request OTP from backend
      const response = await fetch(`${API_URL}/api/auth/phone/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: e164Phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to send OTP'
        };
      }

      return {
        success: true,
        verificationId: data.verificationId,
        expiresIn: data.expiresIn || 300 // Default 5 minutes
      };
    } catch (error) {
      console.error('[PhoneAuth] OTP request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  }

  /**
   * Authenticate user with phone number and OTP
   */
  async authenticate(credentials: PhoneCredentials): Promise<AuthResult> {
    try {
      const { phone, verificationCode } = credentials;

      // Validate input
      if (!phone || !verificationCode) {
        throw this.createError('missing_credentials', 'Phone number and verification code are required');
      }

      // Validate phone number format
      if (!isValidPhoneNumber(phone)) {
        throw this.createError('invalid_phone', 'Invalid phone number format');
      }

      // Parse to E.164 format
      const phoneNumber = parsePhoneNumber(phone);
      const e164Phone = phoneNumber?.number;

      if (!e164Phone) {
        throw this.createError('invalid_phone', 'Could not parse phone number');
      }

      // Get device info
      const deviceInfo = await DeviceManager.getDeviceInfo();

      // Verify OTP and authenticate
      const response = await fetch(`${API_URL}/api/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: e164Phone,
          verificationCode,
          deviceHash: deviceInfo.deviceHash,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion
        })
      });

      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        // Specific error codes
        if (response.status === 401) {
          throw this.createError('invalid_code', 'Invalid or expired verification code');
        }
        
        throw this.createError(
          data.code || 'authentication_failed',
          data.message || 'Phone authentication failed'
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
      console.error('[PhoneAuth] Authentication failed:', error);
      
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
   * Check if phone auth is available
   */
  isAvailable(): boolean {
    // Phone auth is always available (no special config needed)
    // Note: Backend needs SMS provider (Twilio, etc.) configured
    return true;
  }

  /**
   * Format phone number for display (e.g., +1 (234) 567-8900)
   */
  formatPhoneNumber(phone: string): string {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber?.formatInternational() || phone;
    } catch {
      return phone;
    }
  }

  /**
   * Get country code from phone number (e.g., "US", "NG")
   */
  getCountryCode(phone: string): string | undefined {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber?.country;
    } catch {
      return undefined;
    }
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
export const phoneAuthProvider = new PhoneAuthProvider();
