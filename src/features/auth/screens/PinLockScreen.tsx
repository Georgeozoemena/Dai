import { useState, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Animated, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { verifyPin } from "../services/pinService";
import { autoMigratePinOnEntry } from "../lib/pin/pinMigration";
import { useAuthStore } from "../../../store/auth/authStore";
import { 
  authenticateWithBiometrics, 
  checkBiometricCapabilities,
  getBiometricTypeName,
  type BiometricCapabilities 
} from "../services/biometricService";
import { colors } from "../../../theme";

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export function PinLockScreen({ onSuccess }: PinLockScreenProps) {
  const user = useAuthStore((state) => state.user);
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
    // Prevent duplicate execution
    if (checking) {
      console.log('[PinLock] Already checking PIN, skipping duplicate call');
      return;
    }

    const pinCode = pin.join("");
    
    if (pinCode.length !== 4) {
      return setError("Please enter your 4-digit PIN.");
    }

    // Check if user is authenticated
    if (!user || !user.id) {
      setError("No authenticated user found. Please log in again.");
      console.error('[PinLock] No user in auth store');
      return;
    }

    try {
      setChecking(true);
      setError("");

      console.log('[PinLock] Verifying PIN for user:', user.id);
      const valid = await verifyPin(user.id, pinCode);

      if (!valid) {
        console.log('[PinLock] PIN verification failed');
        setError("Incorrect PIN. Please try again.");
        setPin(["", "", "", ""]);
        shakeInputs();
        setTimeout(() => inputRefs[0].current?.focus(), 100);
        return;
      }

      console.log('[PinLock] PIN verified successfully');

      // PIN is valid - auto-migrate from legacy plaintext to hashed if needed
      try {
        console.log('[PinLock] Running auto-migration...');
        await autoMigratePinOnEntry(user.id, pinCode);
        console.log('[PinLock] Auto-migration complete');
      } catch (migrationError) {
        console.error('[PinLock] Migration failed (non-fatal):', migrationError);
        // Don't block unlock if migration fails
      }

      console.log('[PinLock] Calling onSuccess callback');
      onSuccess?.();
    } catch (error) {
      console.error('[PinLock] Unexpected error during PIN verification:', error);
      
      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PinLock] Error details:', errorMessage);
      
      setError("Unable to verify PIN. Please try again.");
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
    <View style={styles.container}>
      {/* Content */}
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
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>
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
                editable={!checking}
              />
              {digit ? (
                <View style={styles.pinDot} />
              ) : null}
            </View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Forgot PIN Link */}
        <Pressable 
          onPress={handleForgotPin} 
          style={styles.forgotPinContainer}
          disabled={checking}
        >
          <Text style={styles.forgotPinText}>Forgot PIN?</Text>
        </Pressable>

        {/* Biometric Button (if available) */}
        {biometricCapabilities?.isAvailable && (
          <Pressable 
            onPress={handleBiometricAuth} 
            disabled={checking}
            style={({ pressed }) => [
              styles.biometricButton,
              pressed && styles.biometricButtonPressed
            ]}
          >
            <Ionicons 
              name={biometricCapabilities.biometricType === "facial" ? "scan" : "finger-print"} 
              size={22} 
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
          style={({ pressed }) => [
            styles.button,
            (!isPinComplete || checking) && styles.buttonDisabled,
            pressed && !(!isPinComplete || checking) && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
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
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
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
