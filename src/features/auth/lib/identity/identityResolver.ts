import Constants from 'expo-constants';
import { authClient } from '../authClient';
import type {
  IdentityMatch,
  IdentityConflict,
  ResolutionStrategy
} from './types';
import type { AuthProvider, AuthUser } from '../providers/types';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

console.log('🔍 API_URL configured as:', API_URL);

/**
 * Identity Resolver
 * 
 * Checks if user already exists with different auth provider
 * Handles account linking and duplicate prevention
 */
export class IdentityResolver {
  private strategy: ResolutionStrategy = 'ask_user';

  /**
   * Set resolution strategy
   */
  setStrategy(strategy: ResolutionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Check if identity already exists
   * Used before creating new account
   */
  async checkIdentity(
    email?: string,
    phone?: string
  ): Promise<IdentityMatch> {
    try {
      // Need at least email or phone
      if (!email && !phone) {
        return {
          exists: false,
          canLink: false,
          reason: 'No identifier provided'
        };
      }

      // Call backend to check for existing identity
      console.log('[IdentityResolver] Checking identity at:', `${API_URL}/api/identity/check`);
      
      const response = await fetch(`${API_URL}/api/identity/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone })
      });

      console.log('[IdentityResolver] Response status:', response.status);
      
      const data = await response.json();
      console.log('[IdentityResolver] Response data:', data);

      if (!response.ok) {
        console.error('[IdentityResolver] Check failed:', {
          status: response.status,
          data
        });
        return {
          exists: false,
          canLink: false,
          reason: `Identity check failed (${response.status}): ${data.message || 'Unknown error'}`
        };
      }

      // No existing identity found
      if (!data.exists) {
        return {
          exists: false,
          canLink: false
        };
      }

      // Identity exists - return match info
      return {
        exists: true,
        userId: data.userId,
        matchedBy: data.matchedBy,
        matchedValue: data.matchedValue,
        existingProviders: data.providers,
        canLink: data.canLink !== false, // Default to true if not specified
        reason: data.reason
      };
    } catch (error) {
      console.error('[IdentityResolver] Check error:', error);
      return {
        exists: false,
        canLink: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve identity conflict
   * Determines what action to take when identity already exists
   */
  async resolveConflict(
    provider: AuthProvider,
    email?: string,
    phone?: string
  ): Promise<IdentityConflict | null> {
    try {
      const match = await this.checkIdentity(email, phone);

      if (!match.exists) {
        return null; // No conflict
      }

      // Check if provider already linked
      if (match.existingProviders?.includes(provider)) {
        return null; // Same provider - user can just log in
      }

      // Determine suggested action based on strategy
      let suggestedAction: 'link' | 'merge' | 'create_new' = 'link';
      
      switch (this.strategy) {
        case 'auto_link':
          suggestedAction = 'link';
          break;
        case 'ask_user':
          suggestedAction = 'link'; // Show UI to ask user
          break;
        case 'create_new':
          suggestedAction = 'create_new';
          break;
        case 'prevent_duplicate':
          // Don't suggest anything - just block
          break;
      }

      const conflict: IdentityConflict = {
        type: 'existing_account',
        matchedBy: match.matchedBy!,
        matchedValue: match.matchedValue!,
        existingUserId: match.userId!,
        existingProviders: match.existingProviders!,
        newProvider: provider,
        suggestedAction,
        requiresVerification: true // Always require verification for linking
      };

      return conflict;
    } catch (error) {
      console.error('[IdentityResolver] Resolve conflict error:', error);
      return null;
    }
  }

  /**
   * Check if user can authenticate with provider
   * Used during login to verify provider is linked
   */
  async canAuthenticateWith(
    userId: string,
    provider: AuthProvider
  ): Promise<boolean> {
    try {
      const response = await authClient.get(
        `/identity/${userId}/providers`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return (data.providers || []).includes(provider);
    } catch (error) {
      console.error('[IdentityResolver] Auth check error:', error);
      return false;
    }
  }

  /**
   * Get user's linked providers
   */
  async getLinkedProviders(userId: string): Promise<AuthProvider[]> {
    try {
      const response = await authClient.get(
        `/identity/${userId}/providers`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      console.error('[IdentityResolver] Get providers error:', error);
      return [];
    }
  }

  /**
   * Get user identity info
   */
  async getUserIdentity(userId: string): Promise<{
    email?: string;
    phone?: string;
    providers: AuthProvider[];
  } | null> {
    try {
      const response = await authClient.get(
        `/identity/${userId}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        email: data.email,
        phone: data.phone,
        providers: data.providers || []
      };
    } catch (error) {
      console.error('[IdentityResolver] Get identity error:', error);
      return null;
    }
  }

  /**
   * Validate that user owns the identifier
   * Used before linking to prevent account takeover
   */
  async validateOwnership(
    userId: string,
    identifier: string,
    type: 'email' | 'phone'
  ): Promise<boolean> {
    try {
      const identity = await this.getUserIdentity(userId);
      
      if (!identity) {
        return false;
      }

      if (type === 'email' && identity.email === identifier) {
        return true;
      }

      if (type === 'phone' && identity.phone === identifier) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[IdentityResolver] Ownership validation error:', error);
      return false;
    }
  }
}

// Singleton instance
export const identityResolver = new IdentityResolver();
