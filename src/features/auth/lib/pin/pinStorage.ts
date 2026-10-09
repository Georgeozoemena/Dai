import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  type HashedPin,
  serializeHashedPin,
  deserializeHashedPin
} from './pinHasher';

/**
 * Storage keys
 */
const getPinKey = (userId: string) => `dai_hashed_pin_${userId}`;
const LEGACY_PIN_PREFIX = 'dai_pin_'; // Old plaintext PIN format

/**
 * Storage abstraction (SecureStore for native, localStorage for web)
 */
const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

/**
 * Store hashed PIN securely
 */
export async function storeHashedPin(
  userId: string,
  hashedPin: HashedPin
): Promise<void> {
  try {
    const serialized = serializeHashedPin(hashedPin);
    await storage.setItem(getPinKey(userId), serialized);
    console.log('[PinStorage] Hashed PIN stored securely');
  } catch (error) {
    console.error('[PinStorage] Failed to store PIN:', error);
    throw new Error('Failed to store PIN');
  }
}

/**
 * Retrieve hashed PIN
 */
export async function getHashedPin(userId: string): Promise<HashedPin | null> {
  try {
    const data = await storage.getItem(getPinKey(userId));
    if (!data) return null;

    return deserializeHashedPin(data);
  } catch (error) {
    console.error('[PinStorage] Failed to retrieve PIN:', error);
    return null;
  }
}

/**
 * Check if user has PIN set up (hashed version)
 */
export async function hasHashedPin(userId: string): Promise<boolean> {
  const hashedPin = await getHashedPin(userId);
  return hashedPin !== null;
}

/**
 * Delete hashed PIN
 */
export async function clearHashedPin(userId: string): Promise<void> {
  try {
    await storage.removeItem(getPinKey(userId));
    console.log('[PinStorage] Hashed PIN cleared');
  } catch (error) {
    console.error('[PinStorage] Failed to clear PIN:', error);
    throw error;
  }
}

/**
 * Check if user has legacy plaintext PIN
 * Used for migration detection
 */
export async function hasLegacyPin(userId: string): Promise<boolean> {
  try {
    const legacyKey = `${LEGACY_PIN_PREFIX}${userId}`;
    const pin = await storage.getItem(legacyKey);
    return pin !== null && pin.length > 0;
  } catch (error) {
    console.error('[PinStorage] Failed to check legacy PIN:', error);
    return false;
  }
}

/**
 * Get legacy plaintext PIN (for migration only)
 */
export async function getLegacyPin(userId: string): Promise<string | null> {
  try {
    const legacyKey = `${LEGACY_PIN_PREFIX}${userId}`;
    return await storage.getItem(legacyKey);
  } catch (error) {
    console.error('[PinStorage] Failed to get legacy PIN:', error);
    return null;
  }
}

/**
 * Clear legacy plaintext PIN (after migration)
 */
export async function clearLegacyPin(userId: string): Promise<void> {
  try {
    const legacyKey = `${LEGACY_PIN_PREFIX}${userId}`;
    await storage.removeItem(legacyKey);
    console.log('[PinStorage] Legacy PIN cleared');
  } catch (error) {
    console.error('[PinStorage] Failed to clear legacy PIN:', error);
    throw error;
  }
}
