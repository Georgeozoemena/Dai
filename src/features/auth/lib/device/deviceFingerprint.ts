import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

/**
 * Device fingerprint data structure
 */
export interface DeviceFingerprint {
  deviceId: string;          // Unique device identifier
  deviceHash: string;        // Hash of all device characteristics
  platform: string;          // 'ios' | 'android' | 'web'
  model: string | null;
  brand: string | null;
  osVersion: string | null;
  appVersion: string;
  buildNumber: string;
  isDevice: boolean;         // false for simulator/emulator
  timestamp: number;
}

/**
 * Generate stable device fingerprint for session binding
 * Uses multiple device characteristics hashed together
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  try {
    // Gather device characteristics
    const deviceId = await getStableDeviceId();
    const platform = Platform.OS;
    const model = Device.modelName;
    const brand = Device.brand;
    const osVersion = Device.osVersion;
    const appVersion = Application.nativeApplicationVersion || '1.0.0';
    const buildNumber = Application.nativeBuildVersion || '1';
    const isDevice = Device.isDevice;

    // Create composite fingerprint string
    const fingerprintData = [
      deviceId,
      platform,
      model,
      brand,
      osVersion,
      appVersion,
      buildNumber,
      isDevice ? 'device' : 'simulator'
    ].join('|');

    // Hash the fingerprint for privacy
    const deviceHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprintData
    );

    const fingerprint: DeviceFingerprint = {
      deviceId,
      deviceHash,
      platform,
      model,
      brand,
      osVersion,
      appVersion,
      buildNumber,
      isDevice,
      timestamp: Date.now()
    };

    return fingerprint;
  } catch (error) {
    console.error('[DeviceFingerprint] Generation failed:', error);
    throw new Error('Failed to generate device fingerprint');
  }
}

/**
 * Get stable device identifier
 * Uses installationId on Android, identifierForVendor on iOS
 */
async function getStableDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const installationId = Application.getAndroidId();
      return installationId || 'unknown-android';
    } else if (Platform.OS === 'ios') {
      const vendorId = await Application.getIosIdForVendorAsync();
      return vendorId || 'unknown-ios';
    } else {
      // Web fallback - use random persistent ID
      return 'web-device';
    }
  } catch (error) {
    console.error('[DeviceFingerprint] Failed to get device ID:', error);
    return 'unknown-device';
  }
}

/**
 * Compare two fingerprints to detect device change
 * Allows minor version updates but flags hardware changes
 */
export function compareFingerprints(
  current: DeviceFingerprint,
  stored: DeviceFingerprint
): {
  isMatch: boolean;
  changed: string[];
} {
  const changed: string[] = [];

  // Critical fields that must match
  if (current.deviceId !== stored.deviceId) changed.push('deviceId');
  if (current.platform !== stored.platform) changed.push('platform');
  if (current.model !== stored.model) changed.push('model');
  if (current.brand !== stored.brand) changed.push('brand');

  // Allow OS version changes (updates are normal)
  // Allow app version changes (updates are normal)
  // Flag simulator/device change (suspicious)
  if (current.isDevice !== stored.isDevice) changed.push('isDevice');

  const isMatch = changed.length === 0;

  return { isMatch, changed };
}

/**
 * Validate fingerprint freshness (not older than 30 days)
 */
export function isFingerprintFresh(fingerprint: DeviceFingerprint): boolean {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const age = Date.now() - fingerprint.timestamp;
  return age < THIRTY_DAYS;
}

/**
 * Serialize fingerprint for storage/transmission
 */
export function serializeFingerprint(fingerprint: DeviceFingerprint): string {
  return JSON.stringify(fingerprint);
}

/**
 * Deserialize fingerprint from storage
 */
export function deserializeFingerprint(data: string): DeviceFingerprint {
  return JSON.parse(data);
}
