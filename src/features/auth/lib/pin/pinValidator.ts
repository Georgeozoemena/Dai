import { hashPin, verifyPin } from './pinHasher';
import {
  getHashedPin,
  storeHashedPin,
  hasHashedPin,
  clearHashedPin
} from './pinStorage';

/**
 * PIN validation result
 */
export interface PinValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Set up new PIN (hashed)
 */
export async function setupPin(
  userId: string,
  pin: string
): Promise<PinValidationResult> {
  try {
    // Validate PIN format
    if (!pin || pin.length < 4) {
      return {
        isValid: false,
        error: 'PIN must be at least 4 digits'
      };
    }

    if (!/^\d+$/.test(pin)) {
      return {
        isValid: false,
        error: 'PIN must contain only digits'
      };
    }

    // Check for weak PINs
    if (isWeakPin(pin)) {
      return {
        isValid: false,
        error: 'PIN is too simple. Please choose a different PIN'
      };
    }

    // Hash and store PIN
    const hashedPin = await hashPin(pin);
    await storeHashedPin(userId, hashedPin);

    console.log('[PinValidator] PIN set up successfully');

    return { isValid: true };
  } catch (error) {
    console.error('[PinValidator] PIN setup failed:', error);
    return {
      isValid: false,
      error: 'Failed to set up PIN'
    };
  }
}

/**
 * Validate PIN input (offline verification)
 */
export async function validatePin(
  userId: string,
  pin: string
): Promise<PinValidationResult> {
  try {
    // Get stored hashed PIN
    const storedHashedPin = await getHashedPin(userId);

    if (!storedHashedPin) {
      return {
        isValid: false,
        error: 'No PIN set up for this user'
      };
    }

    // Verify PIN against hash
    const isValid = await verifyPin(pin, storedHashedPin);

    if (!isValid) {
      return {
        isValid: false,
        error: 'Incorrect PIN'
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('[PinValidator] PIN validation failed:', error);
    return {
      isValid: false,
      error: 'Failed to validate PIN'
    };
  }
}

/**
 * Check if user has PIN configured
 */
export async function userHasPin(userId: string): Promise<boolean> {
  return await hasHashedPin(userId);
}

/**
 * Change PIN (requires old PIN verification)
 */
export async function changePin(
  userId: string,
  oldPin: string,
  newPin: string
): Promise<PinValidationResult> {
  try {
    // Verify old PIN
    const oldPinValid = await validatePin(userId, oldPin);
    if (!oldPinValid.isValid) {
      return {
        isValid: false,
        error: 'Current PIN is incorrect'
      };
    }

    // Set up new PIN
    return await setupPin(userId, newPin);
  } catch (error) {
    console.error('[PinValidator] PIN change failed:', error);
    return {
      isValid: false,
      error: 'Failed to change PIN'
    };
  }
}

/**
 * Reset PIN (requires external authentication)
 */
export async function resetPin(
  userId: string,
  newPin: string
): Promise<PinValidationResult> {
  try {
    // Clear existing PIN
    await clearHashedPin(userId);

    // Set up new PIN
    return await setupPin(userId, newPin);
  } catch (error) {
    console.error('[PinValidator] PIN reset failed:', error);
    return {
      isValid: false,
      error: 'Failed to reset PIN'
    };
  }
}

/**
 * Check for weak/common PINs
 */
function isWeakPin(pin: string): boolean {
  // Reject sequential patterns
  if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin)) {
    return true;
  }

  // Reject repeated digits
  if (/^(\d)\1+$/.test(pin)) {
    return true;
  }

  // Reject common weak PINs
  const weakPins = [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '9876',
    '1212', '2121', '1010', '0101'
  ];

  return weakPins.includes(pin);
}

/**
 * Get PIN strength indicator (for UI feedback)
 */
export function getPinStrength(pin: string): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (pin.length < 4) {
    return { strength: 'weak', message: 'PIN too short' };
  }

  if (isWeakPin(pin)) {
    return { strength: 'weak', message: 'PIN is too common' };
  }

  if (pin.length === 4) {
    return { strength: 'medium', message: 'Good PIN' };
  }

  if (pin.length >= 6) {
    // Check for variety
    const uniqueDigits = new Set(pin.split('')).size;
    if (uniqueDigits >= 4) {
      return { strength: 'strong', message: 'Strong PIN' };
    }
  }

  return { strength: 'medium', message: 'Good PIN' };
}
