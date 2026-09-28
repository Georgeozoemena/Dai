import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, styles.shape1]} />
            <View style={[styles.logoShape, styles.shape2]} />
          </View>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, styles.shape3]} />
            <View style={[styles.logoShape, styles.shape4]} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Enter your PIN to{"\n"}unlock your account</Text>

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
              <Text style={styles.pinDigit}>{digit || ""}</Text>
            </View>
          ))}
        </View>

        {/* Error Message */}
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Forgot PIN Link */}
        <Pressable onPress={handleForgotPin} style={styles.forgotPinContainer}>
          <Text style={styles.forgotPinText}>Forgot PIN?</Text>
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

        {/* Spacer */}
        <View style={{ flex: 1 }} />

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignSelf: "center",
    gap: 8,
    marginBottom: 60,
  },
  logoRow: {
    flexDirection: "row",
    gap: 8,
  },
  logoShape: {
    width: 36,
    height: 36,
    backgroundColor: "#121212",
  },
  shape1: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 14,
  },
  shape2: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 8,
  },
  shape3: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
  },
  shape4: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 32,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  pinBox: {
    width: 64,
    height: 64,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
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
  pinDigit: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  error: {
    color: "#E53E3E",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  forgotPinContainer: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  forgotPinText: {
    fontSize: 15,
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
    borderRadius: 24,
    backgroundColor: "rgba(18, 14, 1, 0.06)",
    marginTop: 12,
    alignSelf: "center",
  },
  biometricButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#120E01",
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FBCC33",
    letterSpacing: 0.3,
  },
});
