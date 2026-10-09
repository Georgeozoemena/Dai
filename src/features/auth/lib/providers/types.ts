/**
 * Auth Provider Types
 * 
 * Defines common interfaces for all authentication providers
 * (Google, Apple, Email, Phone)
 */

/**
 * Authentication provider types
 */
export type AuthProvider = 'google' | 'apple' | 'email' | 'phone';

/**
 * User profile returned from authentication
 */
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

/**
 * Authentication result from backend
 */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  deviceHash?: string;
  expiresIn?: number;
}

/**
 * Provider-specific credentials
 */
export interface GoogleCredentials {
  provider: 'google';
  idToken: string;
}

export interface AppleCredentials {
  provider: 'apple';
  identityToken: string;
  authorizationCode?: string;
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

export interface EmailCredentials {
  provider: 'email';
  email: string;
  password: string;
}

export interface PhoneCredentials {
  provider: 'phone';
  phone: string;
  verificationCode: string;
}

export type AuthCredentials =
  | GoogleCredentials
  | AppleCredentials
  | EmailCredentials
  | PhoneCredentials;

/**
 * Authentication error
 */
export interface AuthError {
  code: string;
  message: string;
  provider?: AuthProvider;
}

/**
 * OTP request result
 */
export interface OtpResult {
  success: boolean;
  verificationId?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Base auth provider interface
 */
export interface IAuthProvider<T extends AuthCredentials = AuthCredentials> {
  readonly provider: AuthProvider;
  
  /**
   * Authenticate user with provider credentials
   */
  authenticate(credentials: T): Promise<AuthResult>;
  
  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;
}

/**
 * Phone auth provider interface (with OTP)
 */
export interface IPhoneAuthProvider extends IAuthProvider<PhoneCredentials> {
  /**
   * Request OTP to be sent to phone number
   */
  requestOtp(phone: string): Promise<OtpResult>;
}

/**
 * Email auth provider interface (with signup)
 */
export interface IEmailAuthProvider extends IAuthProvider<EmailCredentials> {
  /**
   * Sign up new user with email/password
   */
  signup(email: string, password: string, name?: string): Promise<AuthResult>;
}
