/**
 * PIN Security Module
 * 
 * Provides hashed PIN functionality with automatic migration from legacy plaintext PINs
 * All PINs are hashed using PBKDF2-SHA256 with 100,000 iterations
 */

export {
  // PIN Hashing
  hashPin,
  verifyPin,
  serializeHashedPin,
  deserializeHashedPin,
  needsRehash,
  type HashedPin
} from './pinHasher';

export {
  // PIN Storage
  storeHashedPin,
  getHashedPin,
  hasHashedPin,
  clearHashedPin,
  hasLegacyPin,
  getLegacyPin,
  clearLegacyPin
} from './pinStorage';

export {
  // PIN Validation
  setupPin,
  validatePin,
  userHasPin,
  changePin,
  resetPin,
  getPinStrength,
  type PinValidationResult
} from './pinValidator';

export {
  // PIN Migration
  checkMigrationNeeded,
  migrateLegacyPin,
  autoMigratePinOnEntry,
  resetMigrationStatus,
  getMigrationStats,
  type MigrationStatus,
  type MigrationResult
} from './pinMigration';
