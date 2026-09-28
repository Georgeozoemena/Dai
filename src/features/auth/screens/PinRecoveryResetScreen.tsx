import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";

import { setPin as savePin } from "../services/pinService";
import { confirmPinReset } from "../services/pinRecoveryService";

interface PinRecoveryResetScreenProps {
  userId: string;
  onComplete: () => void;
}

export function PinRecoveryResetScreen({
  userId,
  onComplete,
}: PinRecoveryResetScreenProps) {
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
    inputRefs[0].current?.focus();
  }, []);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const handlePinChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newPin = [...currentPin];
    newPin[index] = digit;
    setCurrentPin(newPin);
    setError("");

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
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

      setStep("confirm");
      setError("");

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

      // Save the new PIN
      await savePin(userId, pinCode);

      // Notify backend that reset is complete
      await confirmPinReset(userId);

      onComplete();
    } catch {
      setError("Unable to reset PIN. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPinComplete = currentPin.every((digit) => digit !== "");

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>
          {step === "create"
            ? "Create a new 4-digit PIN"
            : "Confirm your new PIN"}
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
              <Text style={styles.pinDigit}>{digit || ""}</Text>
            </View>
          ))}
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!isPinComplete || saving}
          style={[
            styles.button,
            (!isPinComplete || saving) && styles.buttonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FBCC33" />
          ) : (
            <Text style={styles.buttonText}>
              {step === "create" ? "Continue" : "Reset PIN"}
            </Text>
          )}
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
