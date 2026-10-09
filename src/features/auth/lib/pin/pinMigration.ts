import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hasLegacyPin,
  getLegacyPin,
  clearLegacyPin,
  hasHashedPin
} from './pinStorage';
import { setupPin } from './pinValidator';

/**
 * Migration status
 */
export interface MigrationStatus {
  needsMigration: boolean;
  userId?: string;
  reason?: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  error?: string;
}

const MIGRATION_KEY = '@dai_pin_migration_status';
const MIGRATION_VERSION = 'v1'; // Track migration version

/**
 * Check if user needs PIN migration
 */
export async function checkMigrationNeeded(userId: string): Promise<MigrationStatus> {
  try {
    // Check if already migrated
    const migrationStatus = await AsyncStorage.getItem(MIGRATION_KEY);
    if (migrationStatus === MIGRATION_VERSION) {
      return { needsMigration: false };
    }

    // Check if user has hashed PIN (already on new system)
    const hasNewPin = await hasHashedPin(userId);
    if (hasNewPin) {
      // Mark as migrated
      await AsyncStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
      return { needsMigration: false };
    }

    // Check if user has legacy plaintext PIN
    const hasOldPin = await hasLegacyPin(userId);
    if (hasOldPin) {
      return {
        needsMigration: true,
        userId,
        reason: 'legacy_plaintext_pin_found'
      };
    }

    // No PIN at all - mark as migrated to prevent unnecessary checks
    await AsyncStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
    return { needsMigration: false };
  } catch (error) {
    console.error('[PinMigration] Check failed:', error);
    return { needsMigration: false };
  }
}

/**
 * Migrate legacy plaintext PIN to hashed PIN
 * This happens automatically when user enters their PIN
 */
export async function migrateLegacyPin(
  userId: string,
  plaintextPin: string
): Promise<MigrationResult> {
  try {
    console.log('[PinMigration] Starting migration for user:', userId);

    // Verify this is actually the user's PIN
    const storedLegacyPin = await getLegacyPin(userId);
    if (!storedLegacyPin || storedLegacyPin !== plaintextPin) {
      return {
        success: false,
        error: 'PIN verification failed'
      };
    }

    // Hash and store the PIN using new system
    const result = await setupPin(userId, plaintextPin);
    if (!result.isValid) {
      return {
        success: false,
        error: result.error || 'Failed to hash PIN'
      };
    }

    // Clear legacy plaintext PIN
    await clearLegacyPin(userId);

    // Mark migration complete
    await AsyncStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);

    console.log('[PinMigration] Migration successful');

    return { success: true };
  } catch (error) {
    console.error('[PinMigration] Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    };
  }
}

/**
 * Automatic migration on PIN entry
 * Call this in PinLockScreen after successful PIN verification
 */
export async function autoMigratePinOnEntry(
  userId: string,
  enteredPin: string
): Promise<void> {
  try {
    const status = await checkMigrationNeeded(userId);
    
    if (!status.needsMigration) {
      return;
    }

    console.log('[PinMigration] Auto-migrating PIN...');
    
    const result = await migrateLegacyPin(userId, enteredPin);
    
    if (result.success) {
      console.log('[PinMigration] Auto-migration successful');
      // Optionally show a subtle notification to user
      // "Your PIN security has been upgraded"
    } else {
      console.error('[PinMigration] Auto-migration failed:', result.error);
    }
  } catch (error) {
    console.error('[PinMigration] Auto-migration error:', error);
    // Don't block user login on migration failure
  }
}

/**
 * Reset migration status (for testing/debugging)
 */
export async function resetMigrationStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MIGRATION_KEY);
    console.log('[PinMigration] Migration status reset');
  } catch (error) {
    console.error('[PinMigration] Failed to reset migration status:', error);
  }
}

/**
 * Get migration statistics (for debugging)
 */
export async function getMigrationStats(): Promise<{
  migrationVersion: string | null;
  isMigrated: boolean;
}> {
  try {
    const status = await AsyncStorage.getItem(MIGRATION_KEY);
    return {
      migrationVersion: status,
      isMigrated: status === MIGRATION_VERSION
    };
  } catch (error) {
    console.error('[PinMigration] Failed to get migration stats:', error);
    return {
      migrationVersion: null,
      isMigrated: false
    };
  }
}
