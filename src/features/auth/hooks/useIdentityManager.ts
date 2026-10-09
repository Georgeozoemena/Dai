import { useState, useCallback } from 'react';
import { identityResolver } from '../lib/identity/identityResolver';
import { providerMapper } from '../lib/identity/providerMapper';
import { LinkingWorkflow } from '../lib/identity/linkingWorkflow';
import type {
  LinkProviderResult,
  UnlinkProviderResult,
  IdentityConflict
} from '../lib/identity/types';
import type { AuthProvider } from '../lib/providers/types';

interface UseIdentityManagerReturn {
  // Provider management
  linkedProviders: AuthProvider[];
  loadLinkedProviders: (userId: string) => Promise<void>;
  
  // Linking
  linkProvider: (
    userId: string,
    provider: AuthProvider,
    email?: string,
    phone?: string
  ) => Promise<LinkProviderResult>;
  
  // Unlinking
  unlinkProvider: (
    userId: string,
    provider: AuthProvider
  ) => Promise<UnlinkProviderResult>;
  
  canUnlink: (
    userId: string,
    provider: AuthProvider
  ) => Promise<boolean>;
  
  // Conflict detection
  checkForConflict: (
    provider: AuthProvider,
    email?: string,
    phone?: string
  ) => Promise<IdentityConflict | null>;
  
  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for managing user identity and linked providers
 * 
 * Handles:
 * - Loading linked providers
 * - Linking new providers
 * - Unlinking providers
 * - Detecting account conflicts
 */
export function useIdentityManager(): UseIdentityManagerReturn {
  const [linkedProviders, setLinkedProviders] = useState<AuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user's linked authentication providers
   */
  const loadLinkedProviders = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const providers = await identityResolver.getLinkedProviders(userId);
      setLinkedProviders(providers);
    } catch (err) {
      console.error('[IdentityManager] Load providers error:', err);
      setError('Failed to load linked providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Link new authentication provider to account
   */
  const linkProvider = useCallback(async (
    userId: string,
    provider: AuthProvider,
    email?: string,
    phone?: string
  ): Promise<LinkProviderResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await providerMapper.linkProvider({
        userId,
        provider,
        credentials: { email, phone }
      });

      if (result.success) {
        // Reload linked providers
        await loadLinkedProviders(userId);
      } else {
        setError(result.error || 'Failed to link provider');
      }

      return result;
    } catch (err) {
      console.error('[IdentityManager] Link provider error:', err);
      const error = 'Failed to link provider';
      setError(error);
      return {
        success: false,
        error
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadLinkedProviders]);

  /**
   * Unlink authentication provider from account
   */
  const unlinkProvider = useCallback(async (
    userId: string,
    provider: AuthProvider
  ): Promise<UnlinkProviderResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await providerMapper.unlinkProvider({
        userId,
        provider
      });

      if (result.success) {
        // Update linked providers
        setLinkedProviders(result.remainingProviders || []);
      } else {
        setError(result.error || 'Failed to unlink provider');
      }

      return result;
    } catch (err) {
      console.error('[IdentityManager] Unlink provider error:', err);
      const error = 'Failed to unlink provider';
      setError(error);
      return {
        success: false,
        error
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if provider can be unlinked
   */
  const canUnlink = useCallback(async (
    userId: string,
    provider: AuthProvider
  ): Promise<boolean> => {
    try {
      const result = await providerMapper.canUnlinkProvider(userId, provider);
      return result.canUnlink;
    } catch (err) {
      console.error('[IdentityManager] Can unlink check error:', err);
      return false;
    }
  }, []);

  /**
   * Check for account conflicts before signup/linking
   */
  const checkForConflict = useCallback(async (
    provider: AuthProvider,
    email?: string,
    phone?: string
  ): Promise<IdentityConflict | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const conflict = await identityResolver.resolveConflict(
        provider,
        email,
        phone
      );

      return conflict;
    } catch (err) {
      console.error('[IdentityManager] Conflict check error:', err);
      setError('Failed to check for conflicts');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    linkedProviders,
    loadLinkedProviders,
    linkProvider,
    unlinkProvider,
    canUnlink,
    checkForConflict,
    isLoading,
    error,
    clearError
  };
}

/**
 * Hook for managing account linking workflow
 * Use this for guided linking experience with conflict resolution
 */
export function useLinkingWorkflow() {
  const [workflow] = useState(() => new LinkingWorkflow());
  const [workflowState, setWorkflowState] = useState(workflow.getState());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Start linking workflow
   */
  const startWorkflow = useCallback(async (
    provider: AuthProvider,
    email?: string,
    phone?: string
  ) => {
    setIsLoading(true);
    const result = await workflow.start(provider, email, phone);
    setWorkflowState(workflow.getState());
    setIsLoading(false);
    return result;
  }, [workflow]);

  /**
   * User confirms linking
   */
  const confirmLinking = useCallback(async () => {
    setIsLoading(true);
    const result = await workflow.confirmLinking();
    setWorkflowState(workflow.getState());
    setIsLoading(false);
    return result;
  }, [workflow]);

  /**
   * Complete linking after step-up verification
   */
  const completeLinking = useCallback(async (stepUpVerified: boolean) => {
    setIsLoading(true);
    const result = await workflow.completeLinking(stepUpVerified);
    setWorkflowState(workflow.getState());
    setIsLoading(false);
    return result;
  }, [workflow]);

  /**
   * User declines linking
   */
  const declineLinking = useCallback(() => {
    workflow.declineLinking();
    setWorkflowState(workflow.getState());
  }, [workflow]);

  /**
   * Reset workflow
   */
  const resetWorkflow = useCallback(() => {
    workflow.reset();
    setWorkflowState(workflow.getState());
  }, [workflow]);

  return {
    workflowState,
    startWorkflow,
    confirmLinking,
    completeLinking,
    declineLinking,
    resetWorkflow,
    isLoading
  };
}
