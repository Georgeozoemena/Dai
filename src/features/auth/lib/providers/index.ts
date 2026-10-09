/**
 * Authentication Providers
 * 
 * Unified interface for all authentication methods:
 * - Google OAuth
 * - Apple Sign-In (placeholder)
 * - Email/Password
 * - Phone/OTP
 */

export * from './types';

export { GoogleAuthProvider, googleAuthProvider } from './googleAuth';
export { AppleAuthProvider, appleAuthProvider } from './appleAuth';
export { EmailAuthProvider, emailAuthProvider } from './emailAuth';
export { PhoneAuthProvider, phoneAuthProvider } from './phoneAuth';

// Re-export for convenience
import { googleAuthProvider } from './googleAuth';
import { appleAuthProvider } from './appleAuth';
import { emailAuthProvider } from './emailAuth';
import { phoneAuthProvider } from './phoneAuth';
import type { AuthProvider } from './types';

/**
 * Get provider instance by name
 */
export function getAuthProvider(provider: AuthProvider) {
  switch (provider) {
    case 'google':
      return googleAuthProvider;
    case 'apple':
      return appleAuthProvider;
    case 'email':
      return emailAuthProvider;
    case 'phone':
      return phoneAuthProvider;
    default:
      throw new Error(`Unknown auth provider: ${provider}`);
  }
}

/**
 * Get all available auth providers
 */
export function getAvailableProviders() {
  const providers = [
    googleAuthProvider,
    appleAuthProvider,
    emailAuthProvider,
    phoneAuthProvider
  ];

  return providers.filter(p => p.isAvailable());
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(provider: AuthProvider): boolean {
  return getAuthProvider(provider).isAvailable();
}
