import { authClient } from '../authClient';
import type {
  LinkProviderRequest,
  LinkProviderResult,
  UnlinkProviderRequest,
  UnlinkProviderResult,
  MergeAccountsRequest,
  MergeAccountsResult
} from './types';
import type { AuthProvider } from '../providers/types';

/**
 * Provider Mapper
 * 
 * Handles linking and unlinking authentication providers
 * Manages account merging and data consolidation
 */
export class ProviderMapper {
  /**
   * Link new authentication provider to existing account
   * Requires step-up authentication (PIN + OTP) for security
   */
  async linkProvider(request: LinkProviderRequest): Promise<LinkProviderResult> {
    try {
      const { userId, provider, credentials } = request;

      // Validate input
      if (!userId || !provider) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Call backend to link provider
      const response = await authClient.post('/identity/link-provider', {
        userId,
        provider,
        credentials
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if step-up auth required
        if (response.status === 403 && data.requiresStepUp) {
          return {
            success: false,
            requiresStepUp: true,
            error: data.message || 'Additional verification required'
          };
        }

        return {
          success: false,
          error: data.message || 'Failed to link provider'
        };
      }

      console.log('[ProviderMapper] Provider linked:', provider);

      return {
        success: true,
        userId: data.userId,
        linkedProvider: provider
      };
    } catch (error) {
      console.error('[ProviderMapper] Link provider error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unlink authentication provider from account
   * Prevents unlinking if it's the last provider (user would be locked out)
   */
  async unlinkProvider(request: UnlinkProviderRequest): Promise<UnlinkProviderResult> {
    try {
      const { userId, provider } = request;

      // Validate input
      if (!userId || !provider) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Call backend to unlink provider
      const response = await authClient.post('/identity/unlink-provider', {
        userId,
        provider
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to unlink provider'
        };
      }

      console.log('[ProviderMapper] Provider unlinked:', provider);

      return {
        success: true,
        unlinkedProvider: provider,
        remainingProviders: data.remainingProviders
      };
    } catch (error) {
      console.error('[ProviderMapper] Unlink provider error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Merge two accounts into one
   * Consolidates all data, providers, and settings
   */
  async mergeAccounts(request: MergeAccountsRequest): Promise<MergeAccountsResult> {
    try {
      const { primaryUserId, secondaryUserId, keepPrimaryData } = request;

      // Validate input
      if (!primaryUserId || !secondaryUserId) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      if (primaryUserId === secondaryUserId) {
        return {
          success: false,
          error: 'Cannot merge account with itself'
        };
      }

      // Call backend to merge accounts
      const response = await authClient.post('/identity/merge-accounts', {
        primaryUserId,
        secondaryUserId,
        keepPrimaryData: keepPrimaryData !== false // Default to true
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to merge accounts'
        };
      }

      console.log('[ProviderMapper] Accounts merged:', primaryUserId);

      return {
        success: true,
        mergedUserId: data.userId,
        mergedProviders: data.providers,
        dataConflicts: data.conflicts
      };
    } catch (error) {
      console.error('[ProviderMapper] Merge accounts error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get account linking suggestions
   * Finds accounts that can potentially be merged
   */
  async getLinkingSuggestions(userId: string): Promise<{
    suggestions: Array<{
      matchedUserId: string;
      matchedBy: 'email' | 'phone';
      matchedValue: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      const response = await authClient.get(
        `/identity/${userId}/linking-suggestions`
      );

      if (!response.ok) {
        return { suggestions: [] };
      }

      const data = await response.json();
      return { suggestions: data.suggestions || [] };
    } catch (error) {
      console.error('[ProviderMapper] Get suggestions error:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Check if provider can be unlinked
   * Prevents unlinking the last provider
   */
  async canUnlinkProvider(
    userId: string,
    provider: AuthProvider
  ): Promise<{
    canUnlink: boolean;
    reason?: string;
    remainingProvidersCount?: number;
  }> {
    try {
      const response = await authClient.post('/identity/can-unlink', {
        userId,
        provider
      });

      if (!response.ok) {
        return {
          canUnlink: false,
          reason: 'Unable to check unlink status'
        };
      }

      const data = await response.json();
      return {
        canUnlink: data.canUnlink,
        reason: data.reason,
        remainingProvidersCount: data.remainingProvidersCount
      };
    } catch (error) {
      console.error('[ProviderMapper] Can unlink check error:', error);
      return {
        canUnlink: false,
        reason: 'Unknown error'
      };
    }
  }

  /**
   * Get provider linking history
   * Shows when providers were linked/unlinked
   */
  async getProviderHistory(userId: string): Promise<Array<{
    provider: AuthProvider;
    action: 'linked' | 'unlinked';
    timestamp: number;
  }>> {
    try {
      const response = await authClient.get(
        `/identity/${userId}/provider-history`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('[ProviderMapper] Get history error:', error);
      return [];
    }
  }
}

// Singleton instance
export const providerMapper = new ProviderMapper();
