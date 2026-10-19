import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator, Animated, Image } from "react-native";

import { setPin as savePin } from "../services/pinService";
import { confirmPinReset } from "../services/pinRecoveryService";
import { colors } from "../../../theme";

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

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Auto-focus first input
    setTimeout(() => inputRefs[0].current?.focus(), 300);
  }, []);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
      shakeInputs();
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
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/MOVA.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {step === "create" ? "Create new PIN" : "Confirm new PIN"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "create"
            ? "Choose a new 4-digit PIN"
            : "Re-enter your PIN to confirm"}
        </Text>

        {/* PIN Input Boxes */}
        <Animated.View 
          style={[
            styles.pinContainer,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          {currentPin.map((digit, index) => (
            <View 
              key={index} 
              style={[
                styles.pinBox,
                digit && styles.pinBoxFilled,
                error && styles.pinBoxError,
              ]}
            >
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
              {digit ? (
                <View style={styles.pinDot} />
              ) : null}
            </View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!isPinComplete || saving}
          style={({ pressed }) => [
            styles.button,
            (!isPinComplete || saving) && styles.buttonDisabled,
            pressed && !(!isPinComplete || saving) && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#120E01" />
          ) : (
            <Text style={styles.buttonText}>
              {step === "create" ? "Continue" : "Reset PIN"}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    alignSelf: "center",
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#120E01",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(18, 14, 1, 0.6)",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  pinBox: {
    width: 56,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(18, 14, 1, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pinBoxFilled: {
    borderColor: "#FBCC33",
    backgroundColor: "rgba(251, 204, 51, 0.05)",
  },
  pinBoxError: {
    borderColor: "#E53E3E",
    backgroundColor: "rgba(229, 62, 62, 0.05)",
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
    backgroundColor: "#120E01",
  },
  error: {
    color: "#E53E3E",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 16,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
});
