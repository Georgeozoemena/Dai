import { identityResolver } from './identityResolver';
import { providerMapper } from './providerMapper';
import type {
  IdentityConflict,
  LinkProviderRequest,
  LinkProviderResult
} from './types';
import type { AuthProvider, AuthCredentials } from '../providers/types';

/**
 * Linking workflow step
 */
export type LinkingStep =
  | 'detect_conflict'    // Check if account exists
  | 'show_conflict_ui'   // Show user the conflict
  | 'verify_ownership'   // Verify user owns the account
  | 'link_provider'      // Link the provider
  | 'complete';          // Linking complete

/**
 * Linking workflow state
 */
export interface LinkingWorkflowState {
  currentStep: LinkingStep;
  conflict: IdentityConflict | null;
  existingUserId: string | null;
  newProvider: AuthProvider | null;
  credentials: Partial<AuthCredentials> | null;
  requiresStepUp: boolean;
  error: string | null;
}

/**
 * Linking Workflow Handler
 * 
 * Manages the multi-step process of linking a new provider
 * to an existing account when a conflict is detected
 */
export class LinkingWorkflow {
  private state: LinkingWorkflowState = {
    currentStep: 'detect_conflict',
    conflict: null,
    existingUserId: null,
    newProvider: null,
    credentials: null,
    requiresStepUp: false,
    error: null
  };

  /**
   * Start linking workflow
   * Check if account exists and create conflict if found
   */
  async start(
    provider: AuthProvider,
    email?: string,
    phone?: string
  ): Promise<{
    hasConflict: boolean;
    conflict?: IdentityConflict;
    canProceed: boolean;
  }> {
    try {
      // Reset state
      this.state = {
        currentStep: 'detect_conflict',
        conflict: null,
        existingUserId: null,
        newProvider: provider,
        credentials: { email, phone } as any,
        requiresStepUp: false,
        error: null
      };

      // Check for identity conflict
      const conflict = await identityResolver.resolveConflict(
        provider,
        email,
        phone
      );

      if (!conflict) {
        // No conflict - proceed with normal signup
        this.state.currentStep = 'complete';
        return {
          hasConflict: false,
          canProceed: true
        };
      }

      // Conflict detected
      this.state.conflict = conflict;
      this.state.existingUserId = conflict.existingUserId;
      this.state.currentStep = 'show_conflict_ui';

      return {
        hasConflict: true,
        conflict,
        canProceed: conflict.suggestedAction !== 'create_new'
      };
    } catch (error) {
      console.error('[LinkingWorkflow] Start error:', error);
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      return {
        hasConflict: false,
        canProceed: false
      };
    }
  }

  /**
   * User confirms they want to link accounts
   */
  async confirmLinking(): Promise<{
    success: boolean;
    requiresStepUp: boolean;
    error?: string;
  }> {
    try {
      if (!this.state.existingUserId || !this.state.newProvider) {
        return {
          success: false,
          requiresStepUp: false,
          error: 'Invalid workflow state'
        };
      }

      // Linking always requires step-up authentication for security
      this.state.currentStep = 'verify_ownership';
      this.state.requiresStepUp = true;

      return {
        success: true,
        requiresStepUp: true
      };
    } catch (error) {
      console.error('[LinkingWorkflow] Confirm error:', error);
      return {
        success: false,
        requiresStepUp: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete linking after step-up verification
   */
  async completeLinking(
    stepUpVerified: boolean = false
  ): Promise<LinkProviderResult> {
    try {
      if (!stepUpVerified && this.state.requiresStepUp) {
        return {
          success: false,
          requiresStepUp: true,
          error: 'Step-up verification required'
        };
      }

      if (!this.state.existingUserId || !this.state.newProvider) {
        return {
          success: false,
          error: 'Invalid workflow state'
        };
      }

      // Build link request
      const linkRequest: LinkProviderRequest = {
        userId: this.state.existingUserId,
        provider: this.state.newProvider,
        credentials: {
          email: this.state.credentials?.email,
          phone: this.state.credentials?.phone
        }
      };

      // Link the provider
      this.state.currentStep = 'link_provider';
      const result = await providerMapper.linkProvider(linkRequest);

      if (result.success) {
        this.state.currentStep = 'complete';
      } else {
        this.state.error = result.error || 'Linking failed';
      }

      return result;
    } catch (error) {
      console.error('[LinkingWorkflow] Complete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * User declines linking - create new account instead
   */
  declineLinking(): void {
    this.state.currentStep = 'complete';
    this.state.conflict = null;
  }

  /**
   * Get current workflow state
   */
  getState(): LinkingWorkflowState {
    return { ...this.state };
  }

  /**
   * Reset workflow
   */
  reset(): void {
    this.state = {
      currentStep: 'detect_conflict',
      conflict: null,
      existingUserId: null,
      newProvider: null,
      credentials: null,
      requiresStepUp: false,
      error: null
    };
  }
}

/**
 * Convenience function for quick conflict detection
 */
export async function detectAccountConflict(
  provider: AuthProvider,
  email?: string,
  phone?: string
): Promise<IdentityConflict | null> {
  return identityResolver.resolveConflict(provider, email, phone);
}

/**
 * Convenience function for linking provider after conflict resolution
 */
export async function linkProviderToAccount(
  userId: string,
  provider: AuthProvider,
  email?: string,
  phone?: string
): Promise<LinkProviderResult> {
  return providerMapper.linkProvider({
    userId,
    provider,
    credentials: { email, phone }
  });
}
