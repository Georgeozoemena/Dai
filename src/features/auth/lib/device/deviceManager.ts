import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateDeviceFingerprint,
  compareFingerprints,
  isFingerprintFresh,
  serializeFingerprint,
  deserializeFingerprint,
  type DeviceFingerprint
} from './deviceFingerprint';

const DEVICE_FINGERPRINT_KEY = '@dai_device_fingerprint';
const DEVICE_REGISTERED_KEY = '@dai_device_registered';

/**
 * Device registration status
 */
export interface DeviceStatus {
  isRegistered: boolean;
  fingerprint: DeviceFingerprint | null;
  needsReregistration: boolean;
  changeReason?: string[];
}

/**
 * Manages device registration and fingerprint validation
 * Used for token refresh and session binding
 */
export class DeviceManager {
  /**
   * Get current device fingerprint
   */
  static async getCurrentFingerprint(): Promise<DeviceFingerprint> {
    return await generateDeviceFingerprint();
  }

  /**
   * Get stored device fingerprint
   */
  static async getStoredFingerprint(): Promise<DeviceFingerprint | null> {
    try {
      const stored = await AsyncStorage.getItem(DEVICE_FINGERPRINT_KEY);
      if (!stored) return null;
      return deserializeFingerprint(stored);
    } catch (error) {
      console.error('[DeviceManager] Failed to get stored fingerprint:', error);
      return null;
    }
  }

  /**
   * Check device registration status
   */
  static async getDeviceStatus(): Promise<DeviceStatus> {
    try {
      const [current, stored, registered] = await Promise.all([
        this.getCurrentFingerprint(),
        this.getStoredFingerprint(),
        AsyncStorage.getItem(DEVICE_REGISTERED_KEY)
      ]);

      // No stored fingerprint = not registered
      if (!stored || registered !== 'true') {
        return {
          isRegistered: false,
          fingerprint: current,
          needsReregistration: true,
          changeReason: ['not_registered']
        };
      }

      // Check fingerprint freshness
      if (!isFingerprintFresh(stored)) {
        return {
          isRegistered: true,
          fingerprint: current,
          needsReregistration: true,
          changeReason: ['fingerprint_expired']
        };
      }

      // Compare fingerprints
      const { isMatch, changed } = compareFingerprints(current, stored);

      if (!isMatch) {
        return {
          isRegistered: true,
          fingerprint: current,
          needsReregistration: true,
          changeReason: changed
        };
      }

      // All good
      return {
        isRegistered: true,
        fingerprint: current,
        needsReregistration: false
      };
    } catch (error) {
      console.error('[DeviceManager] Failed to get device status:', error);
      throw error;
    }
  }

  /**
   * Register device and store fingerprint
   * Called after successful authentication
   */
  static async registerDevice(fingerprint?: DeviceFingerprint): Promise<void> {
    try {
      const fp = fingerprint || await this.getCurrentFingerprint();
      const serialized = serializeFingerprint(fp);

      // Use individual setItem calls instead of multiSet for better compatibility
      await AsyncStorage.setItem(DEVICE_FINGERPRINT_KEY, serialized);
      await AsyncStorage.setItem(DEVICE_REGISTERED_KEY, 'true');

      console.log('[DeviceManager] Device registered:', fp.deviceHash);
    } catch (error) {
      console.error('[DeviceManager] Failed to register device:', error);
      throw new Error('Failed to register device');
    }
  }

  /**
   * Update stored fingerprint (after app/OS update)
   */
  static async updateFingerprint(): Promise<void> {
    try {
      const current = await this.getCurrentFingerprint();
      await this.registerDevice(current);
      console.log('[DeviceManager] Fingerprint updated');
    } catch (error) {
      console.error('[DeviceManager] Failed to update fingerprint:', error);
      throw error;
    }
  }

  /**
   * Unregister device (logout, security breach)
   */
  static async unregisterDevice(): Promise<void> {
    try {
      // Use individual removeItem calls instead of multiRemove for better compatibility
      await AsyncStorage.removeItem(DEVICE_FINGERPRINT_KEY);
      await AsyncStorage.removeItem(DEVICE_REGISTERED_KEY);
      
      console.log('[DeviceManager] Device unregistered');
    } catch (error) {
      console.error('[DeviceManager] Failed to unregister device:', error);
      throw error;
    }
  }

  /**
   * Validate device for token refresh
   * Returns true if device is registered and fingerprint matches
   */
  static async validateDeviceForRefresh(): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      const status = await this.getDeviceStatus();

      if (!status.isRegistered) {
        return { isValid: false, reason: 'device_not_registered' };
      }

      if (status.needsReregistration) {
        return {
          isValid: false,
          reason: `device_changed: ${status.changeReason?.join(', ')}`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('[DeviceManager] Validation failed:', error);
      return { isValid: false, reason: 'validation_error' };
    }
  }

  /**
   * Get device info for backend registration/verification
   */
  static async getDeviceInfo(): Promise<{
    deviceHash: string;
    platform: string;
    model: string | null;
    osVersion: string | null;
    appVersion: string;
  }> {
    const fingerprint = await this.getCurrentFingerprint();
    return {
      deviceHash: fingerprint.deviceHash,
      platform: fingerprint.platform,
      model: fingerprint.model,
      osVersion: fingerprint.osVersion,
      appVersion: fingerprint.appVersion
    };
  }
}
