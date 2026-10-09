/**
 * Identity Resolution & Provider Linking
 * 
 * Handles account linking, identity conflicts, and provider management
 * Prevents duplicate accounts and enables multi-provider authentication
 */

export * from './types';

export {
  IdentityResolver,
  identityResolver
} from './identityResolver';

export {
  ProviderMapper,
  providerMapper
} from './providerMapper';

export {
  LinkingWorkflow,
  detectAccountConflict,
  linkProviderToAccount
} from './linkingWorkflow';
