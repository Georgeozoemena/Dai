/**
 * PIN Service - Legacy Compatibility Layer
 * 
 * This file maintains backward compatibility with existing code
 * while using the new hashed PIN system under the hood.
 * 
 * MIGRATION NOTES:
 * - setPin() now hashes PINs before storage
 * - verifyPin() handles both legacy plaintext and new hashed PINs
 * - Auto-migration happens transparently on first PIN verification
 */

import {
  setupPin,
  validatePin,
  userHasPin,
  clearHashedPin,
  autoMigratePinOnEntry,
  hasLegacyPin,
  getLegacyPin
} from '../lib/pin';

/**
 * Set up PIN (hashed)
 * @deprecated Consider using setupPin() from '../lib/pin' directly
 */
export async function setPin(
  userId: string,
  pin: string,
): Promise<void> {
  const result = await setupPin(userId, pin);
  
  if (!result.isValid) {
    throw new Error(result.error || 'Failed to set PIN');
  }
}

/**
 * Check if user has PIN configured
 * @deprecated Consider using userHasPin() from '../lib/pin' directly
 */
export async function hasPin(
  userId: string,
): Promise<boolean> {
  // Check both hashed and legacy PIN
  const hasNew = await userHasPin(userId);
  const hasLegacy = await hasLegacyPin(userId);
  
  return hasNew || hasLegacy;
}

/**
 * Verify PIN (with automatic migration)
 * Handles both legacy plaintext and new hashed PINs
 * @deprecated Consider using validatePin() from '../lib/pin' directly
 */
export async function verifyPin(
  userId: string,
  pin: string,
): Promise<boolean> {
  // Try new hashed PIN first
  const hashedResult = await validatePin(userId, pin);
  if (hashedResult.isValid) {
    return true;
  }

  // Check if user has legacy plaintext PIN
  const hasLegacy = await hasLegacyPin(userId);
  if (!hasLegacy) {
    return false;
  }

  // Verify against legacy plaintext PIN
  const legacyPin = await getLegacyPin(userId);
  if (legacyPin === pin) {
    // PIN matches! Auto-migrate to hashed version
    console.log('[PinService] Legacy PIN verified, migrating...');
    await autoMigratePinOnEntry(userId, pin);
    return true;
  }

  return false;
}

/**
 * Clear PIN
 * @deprecated Consider using clearHashedPin() from '../lib/pin' directly
 */
export async function clearPin(
  userId: string,
): Promise<void> {
  await clearHashedPin(userId);
}

/**
 * Legacy getPin() - NO LONGER SUPPORTED
 * PINs are now hashed and cannot be retrieved in plaintext
 * @deprecated This function always returns null. Use verifyPin() instead.
 */
export async function getPin(
  userId: string,
): Promise<string | null> {
  console.warn('[PinService] getPin() is deprecated. PINs are now hashed and cannot be retrieved.');
  return null;
}
