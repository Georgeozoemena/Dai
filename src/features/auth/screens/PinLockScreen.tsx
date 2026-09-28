import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Animated } from "react-native";
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
import { useTheme } from "../../../contexts/ThemeContext";
import { colors } from "../../../theme";

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export function PinLockScreen({ onSuccess }: PinLockScreenProps) {
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    // Check biometric capabilities
    checkBiometricCapabilities().then(setBiometricCapabilities);
    
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
        shakeInputs();
        inputRefs[0].current?.focus();
        return;
      }

      onSuccess?.();
    } catch {
      setError("Unable to verify PIN.");
      shakeInputs();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, { backgroundColor: isDark ? colors.primary : "#120E01" }]} />
            <View style={[styles.logoShape, { backgroundColor: isDark ? colors.primary : "#120E01" }]} />
          </View>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, { backgroundColor: isDark ? colors.primary : "#120E01" }]} />
            <View style={[styles.logoShape, { backgroundColor: isDark ? colors.primary : "#120E01" }]} />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Enter PIN</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your 4-digit PIN to unlock your account
        </Text>

        {/* PIN Input Boxes */}
        <Animated.View 
          style={[
            styles.pinContainer,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          {pin.map((digit, index) => (
            <View 
              key={index} 
              style={[
                styles.pinBox,
                { backgroundColor: colors.surface, borderColor: colors.borderInput },
                digit && styles.pinBoxFilled,
                digit && { borderColor: colors.primary, backgroundColor: isDark ? "rgba(251, 204, 51, 0.1)" : "rgba(251, 204, 51, 0.05)" },
                error && styles.pinBoxError,
                error && { borderColor: colors.error, backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(229, 62, 62, 0.05)" },
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
                <View style={[styles.pinDot, { backgroundColor: colors.text }]} />
              ) : null}
            </View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        {/* Forgot PIN Link */}
        <Pressable onPress={handleForgotPin} style={styles.forgotPinContainer}>
          <Text style={[styles.forgotPinText, { color: colors.text }]}>Forgot PIN?</Text>
        </Pressable>

        {/* Biometric Button (if available) */}
        {biometricCapabilities?.isAvailable && (
          <Pressable 
            onPress={handleBiometricAuth} 
            style={({ pressed }) => [
              styles.biometricButton,
              { backgroundColor: colors.surface, borderColor: colors.borderInput },
              pressed && styles.biometricButtonPressed,
            ]}
          >
            <Ionicons 
              name={biometricCapabilities.biometricType === "facial" ? "scan" : "finger-print"} 
              size={22} 
              color={colors.text} 
            />
            <Text style={[styles.biometricButtonText, { color: colors.text }]}>
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
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            (!isPinComplete || checking) && styles.buttonDisabled,
            pressed && !(!isPinComplete || checking) && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, { color: isDark ? "#0A0A0A" : "#120E01" }]}>
            {checking ? "Verifying..." : "Continue"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoContainer: {
    alignSelf: "center",
    gap: 8,
    marginBottom: 80,
  },
  logoRow: {
    flexDirection: "row",
    gap: 8,
  },
  logoShape: {
    width: 40,
    height: 40,
    backgroundColor: "#120E01",
  },
  shape1: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 16,
  },
  shape2: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 8,
  },
  shape3: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 20,
  },
  shape4: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 10,
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
    transition: "all 0.2s ease",
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
    marginBottom: 8,
  },
  forgotPinContainer: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  forgotPinText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#120E01",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(18, 14, 1, 0.15)",
    marginTop: 16,
    alignSelf: "center",
  },
  biometricButtonPressed: {
    backgroundColor: "rgba(18, 14, 1, 0.05)",
    transform: [{ scale: 0.98 }],
  },
  biometricButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#120E01",
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
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
