/**
 * Identity Resolution Types
 * 
 * Handles account linking, merging, and identity consolidation
 * across multiple authentication providers
 */

import type { AuthProvider, AuthUser } from '../providers/types';

/**
 * User identity information
 */
export interface UserIdentity {
  userId: string;
  email?: string;
  phone?: string;
  providers: AuthProvider[];
  createdAt: number;
  lastLoginAt: number;
}

/**
 * Identity match result
 */
export interface IdentityMatch {
  exists: boolean;
  userId?: string;
  matchedBy?: 'email' | 'phone';
  matchedValue?: string;
  existingProviders?: AuthProvider[];
  canLink?: boolean;
  reason?: string;
}

/**
 * Provider link request
 */
export interface LinkProviderRequest {
  userId: string;
  provider: AuthProvider;
  credentials: {
    email?: string;
    phone?: string;
    providerUserId?: string;
  };
}

/**
 * Provider link result
 */
export interface LinkProviderResult {
  success: boolean;
  userId?: string;
  linkedProvider?: AuthProvider;
  error?: string;
  requiresStepUp?: boolean; // Requires additional verification (PIN/OTP)
}

/**
 * Provider unlink request
 */
export interface UnlinkProviderRequest {
  userId: string;
  provider: AuthProvider;
}

/**
 * Provider unlink result
 */
export interface UnlinkProviderResult {
  success: boolean;
  unlinkedProvider?: AuthProvider;
  remainingProviders?: AuthProvider[];
  error?: string;
}

/**
 * Account merge request
 */
export interface MergeAccountsRequest {
  primaryUserId: string;   // Account to keep
  secondaryUserId: string; // Account to merge and delete
  keepPrimaryData?: boolean; // If true, keep primary user's data, discard secondary
}

/**
 * Account merge result
 */
export interface MergeAccountsResult {
  success: boolean;
  mergedUserId?: string;
  mergedProviders?: AuthProvider[];
  dataConflicts?: DataConflict[];
  error?: string;
}

/**
 * Data conflict during merge
 */
export interface DataConflict {
  field: string;
  primaryValue: any;
  secondaryValue: any;
  resolution?: 'keep_primary' | 'keep_secondary' | 'merge';
}

/**
 * Identity conflict (user already exists with different provider)
 */
export interface IdentityConflict {
  type: 'existing_account';
  matchedBy: 'email' | 'phone';
  matchedValue: string;
  existingUserId: string;
  existingProviders: AuthProvider[];
  newProvider: AuthProvider;
  suggestedAction: 'link' | 'merge' | 'create_new';
  requiresVerification: boolean;
}

/**
 * Identity resolution strategy
 */
export type ResolutionStrategy = 
  | 'auto_link'      // Automatically link if email/phone matches
  | 'ask_user'       // Ask user if they want to link
  | 'create_new'     // Always create new account (no linking)
  | 'prevent_duplicate'; // Block signup if account exists

/**
 * Identity resolution configuration
 */
export interface IdentityResolutionConfig {
  strategy: ResolutionStrategy;
  allowMultipleProviders: boolean;
  requireVerificationForLinking: boolean;
  autoMergeData: boolean;
}
