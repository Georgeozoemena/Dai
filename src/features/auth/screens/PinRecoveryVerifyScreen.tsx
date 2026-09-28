import { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { verifyPinResetCode, sendPinResetCode } from "../services/pinRecoveryService";

interface PinRecoveryVerifyScreenProps {
  email: string;
  onVerified: (userId: string) => void;
  onCancel: () => void;
}

export function PinRecoveryVerifyScreen({
  email,
  onVerified,
  onCancel,
}: PinRecoveryVerifyScreenProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const response = await verifyPinResetCode(email, verificationCode);
      onVerified(response.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
      setCode(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      setError("");
      setResent(false);

      await sendPinResetCode(email);
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();

      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <View style={styles.container}>
      {/* Dark Background Header */}
      <LinearGradient
        colors={['#1a1612', '#120E01']}
        style={styles.headerGradient}
      >
        <Pressable onPress={onCancel} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Verify your account</Text>
        <Text style={styles.headerSubtitle}>
          Please enter the 6-digit verification code we sent to your email to proceed securely.
        </Text>
      </LinearGradient>

      {/* White Card Content */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <View key={index} style={styles.codeBox}>
                <TextInput
                  ref={inputRefs[index]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.codeInput}
                  editable={!verifying}
                />
                <Text style={styles.codeDigit}>{digit || ""}</Text>
              </View>
            ))}
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Success Message */}
          {resent ? (
            <Text style={styles.success}>Code resent successfully!</Text>
          ) : null}

          {/* Verify Button */}
          <Pressable
            onPress={handleVerify}
            disabled={!isCodeComplete || verifying}
            style={[
              styles.button,
              (!isCodeComplete || verifying) && styles.buttonDisabled,
            ]}
          >
            {verifying ? (
              <ActivityIndicator color="#FBCC33" />
            ) : (
              <Text style={styles.buttonText}>Verification</Text>
            )}
          </Pressable>

          {/* Resend Link */}
          <Pressable
            onPress={handleResendCode}
            disabled={resending}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>
              {resending ? "Sending..." : "Don't received code? Resend Now"}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  codeBox: {
    width: 48,
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.1)",
  },
  codeInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: "700",
    color: "#120E01",
  },
  error: {
    color: "#E53E3E",
    fontSize: 13,
    textAlign: "center",
    marginTop: -16,
    marginBottom: 16,
  },
  success: {
    color: "#22C55E",
    fontSize: 13,
    textAlign: "center",
    marginTop: -16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FBCC33",
  },
  resendContainer: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#120E01",
    textDecorationLine: "underline",
  },
});
