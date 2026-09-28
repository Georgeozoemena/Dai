import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: "fingerprint" | "facial" | "iris" | "none";
  isEnrolled: boolean;
}

/**
 * Check if biometric authentication is available and configured
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    // Web doesn't support biometrics through expo-local-authentication
    if (Platform.OS === "web") {
      return {
        isAvailable: false,
        biometricType: "none",
        isEnrolled: false,
      };
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!compatible || !enrolled) {
      return {
        isAvailable: false,
        biometricType: "none",
        isEnrolled: enrolled,
      };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let biometricType: "fingerprint" | "facial" | "iris" | "none" = "none";
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = "facial";
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = "fingerprint";
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = "iris";
    }

    return {
      isAvailable: true,
      biometricType,
      isEnrolled: enrolled,
    };
  } catch (error) {
    console.error("Error checking biometric capabilities:", error);
    return {
      isAvailable: false,
      biometricType: "none",
      isEnrolled: false,
    };
  }
}

/**
 * Authenticate using biometrics (Face ID, Touch ID, etc.)
 */
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (Platform.OS === "web") {
      return {
        success: false,
        error: "Biometric authentication is not available on web",
      };
    }

    const capabilities = await checkBiometricCapabilities();
    
    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: capabilities.isEnrolled 
          ? "Biometric authentication is not supported on this device"
          : "No biometric credentials enrolled on this device",
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Dai",
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // We handle PIN ourselves
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || "Authentication failed",
    };
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: "An error occurred during authentication",
    };
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export function getBiometricTypeName(type: BiometricCapabilities["biometricType"]): string {
  switch (type) {
    case "facial":
      return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
    case "fingerprint":
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
    case "iris":
      return "Iris Recognition";
    default:
      return "Biometric";
  }
}
