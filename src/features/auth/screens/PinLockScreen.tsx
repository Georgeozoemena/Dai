import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { verifyPin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";
import { 
  authenticateWithBiometrics, 
  checkBiometricCapabilities,
  getBiometricTypeName,
  type BiometricCapabilities 
} from "../services/biometricService";

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export function PinLockScreen({ onSuccess }: PinLockScreenProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    // Check biometric capabilities
    checkBiometricCapabilities().then(setBiometricCapabilities);
    
    // Auto-focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handlePinChange = (value: string, index: number) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError("");

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleUnlock = async () => {
    const pinCode = pin.join("");
    
    if (pinCode.length !== 4) {
      return setError("Please enter your 4-digit PIN.");
    }

    try {
      setChecking(true);
      setError("");

      const valid = await verifyPin(
        await requireCurrentUserId(),
        pinCode,
      );

      if (!valid) {
        setError("Incorrect PIN. Please try again.");
        setPin(["", "", "", ""]);
        inputRefs[0].current?.focus();
        return;
      }

      onSuccess?.();
    } catch {
      setError("Unable to verify PIN.");
    } finally {
      setChecking(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setError("");
      const result = await authenticateWithBiometrics();
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError("Unable to authenticate");
    }
  };

  const handleForgotPin = () => {
    // Navigate to PIN recovery flow
    router.push("/pin-recovery");
  };

  const isPinComplete = pin.every((digit) => digit !== "");

  return (
    <View style={styles.container}>
      {/* Dark Background Header */}
      <LinearGradient
        colors={['#1a1612', '#120E01']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>
          Use phone or email to{"\n"}reset your password
        </Text>
        <Text style={styles.headerSubtitle}>
          Enter your email or phone to reset your password easily.
        </Text>
      </LinearGradient>

      {/* White Card Content */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Enter your password</Text>

          {/* PIN Input Boxes */}
          <View style={styles.pinContainer}>
            {pin.map((digit, index) => (
              <View key={index} style={styles.pinBox}>
                <TextInput
                  ref={inputRefs[index]}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.pinInput}
                  secureTextEntry
                />
                <View style={[styles.pinDot, digit && styles.pinDotFilled]} />
              </View>
            ))}
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {/* Continue Button */}
          <Pressable
            onPress={handleUnlock}
            disabled={!isPinComplete || checking}
            style={[
              styles.button,
              (!isPinComplete || checking) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {checking ? "Verifying..." : "Continue"}
            </Text>
          </Pressable>

          {/* Forgot PIN Link */}
          <Pressable onPress={handleForgotPin} style={styles.forgotPinContainer}>
            <Text style={styles.forgotPinText}>Forgot Password?</Text>
          </Pressable>

          {/* Biometric Button (if available) */}
          {biometricCapabilities?.isAvailable && (
            <Pressable onPress={handleBiometricAuth} style={styles.biometricButton}>
              <Ionicons 
                name={biometricCapabilities.biometricType === "facial" ? "scan" : "finger-print"} 
                size={24} 
                color="#120E01" 
              />
              <Text style={styles.biometricButtonText}>
                Use {getBiometricTypeName(biometricCapabilities.biometricType)}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#120E01",
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 32,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#120E01",
    marginBottom: 24,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  pinBox: {
    width: 56,
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pinInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(18, 14, 1, 0.2)",
  },
  pinDotFilled: {
    backgroundColor: "#120E01",
    borderColor: "#120E01",
  },
  error: {
    color: "#E53E3E",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FBCC33",
  },
  forgotPinContainer: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  forgotPinText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#120E01",
    textDecorationLine: "underline",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "rgba(18, 14, 1, 0.06)",
    marginTop: 16,
    alignSelf: "center",
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#120E01",
  },
});
