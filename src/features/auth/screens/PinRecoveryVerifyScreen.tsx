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
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

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

        {/* Resend Link */}
        <Pressable
          onPress={handleResendCode}
          disabled={resending}
          style={styles.resendContainer}
        >
          <Text style={styles.resendText}>
            {resending ? "Sending..." : "Didn't receive the code? Resend"}
          </Text>
        </Pressable>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

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
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </Pressable>
      </View>
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
  titleSection: {
    marginBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#120E01",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(18, 14, 1, 0.6)",
    lineHeight: 24,
  },
  email: {
    fontWeight: "600",
    color: "#120E01",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  codeBox: {
    width: 48,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "rgba(18, 14, 1, 0.15)",
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
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  success: {
    color: "#22C55E",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  resendContainer: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#120E01",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#FBCC33",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FBCC33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#120E01",
    letterSpacing: 0.2,
  },
});
