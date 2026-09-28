import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { setPin as savePin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";

interface PinSetupScreenProps {
  onComplete?: () => void;
}

export function PinSetupScreen({ onComplete }: PinSetupScreenProps) {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const handlePinChange = (value: string, index: number) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newPin = [...currentPin];
    newPin[index] = digit;
    setCurrentPin(newPin);
    setError("");

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !currentPin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleContinue = async () => {
    if (step === "create") {
      const pinCode = pin.join("");
      
      if (pinCode.length !== 4) {
        return setError("Please enter a 4-digit PIN.");
      }

      // Move to confirmation step
      setStep("confirm");
      setError("");
      
      // Reset and focus first input
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
      
      return;
    }

    // Confirm step
    const pinCode = pin.join("");
    const confirmCode = confirmPin.join("");
    
    if (confirmCode.length !== 4) {
      return setError("Please confirm your 4-digit PIN.");
    }

    if (pinCode !== confirmCode) {
      setError("PINs don't match. Please try again.");
      setConfirmPin(["", "", "", ""]);
      inputRefs[0].current?.focus();
      return;
    }

    try {
      setSaving(true);
      setError("");

      await savePin(
        await requireCurrentUserId(),
        pinCode,
      );

      onComplete?.();
    } catch {
      setError("Unable to create PIN.");
    } finally {
      setSaving(false);
    }
  };

  const isPinComplete = currentPin.every((digit) => digit !== "");

  return (
    <View style={styles.container}>
      {/* Dark Background Header */}
      <LinearGradient
        colors={['#1a1612', '#120E01']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>
          {step === "create" 
            ? "Secure your account\nwith a new password" 
            : "Confirm your PIN"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {step === "create"
            ? "Create a strong password to secure your personal data."
            : "Please re-enter your PIN to confirm."}
        </Text>
      </LinearGradient>

      {/* White Card Content */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            {step === "create" ? "Password" : "Confirm password"}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {step === "create" 
              ? "Enter your new password"
              : "Confirm your new password"}
          </Text>

          {/* PIN Input Boxes */}
          <View style={styles.pinContainer}>
            {currentPin.map((digit, index) => (
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
            onPress={handleContinue}
            disabled={!isPinComplete || saving}
            style={[
              styles.button,
              (!isPinComplete || saving) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {saving ? "Creating..." : step === "create" ? "Continue" : "Reset Password"}
            </Text>
          </Pressable>
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
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "rgba(18, 14, 1, 0.6)",
    marginBottom: 32,
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FBCC33",
  },
});
