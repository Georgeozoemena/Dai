import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { sendPinResetCode } from "../services/pinRecoveryService";

interface PinRecoveryEmailScreenProps {
  onCodeSent: (email: string) => void;
  onCancel: () => void;
}

export function PinRecoveryEmailScreen({
  onCodeSent,
  onCancel,
}: PinRecoveryEmailScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSending(true);
      setError("");

      await sendPinResetCode(email.trim());
      onCodeSent(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={12}>
            <Ionicons name="arrow-back" size={28} color="#120E01" />
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Forgot your PIN?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a verification code to reset your PIN.
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            style={styles.input}
            editable={!sending}
          />
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#120E01" />
          <Text style={styles.infoText}>
            The code will expire in 10 minutes
          </Text>
        </View>

        {/* Send Code Button */}
        <Pressable
          onPress={handleSendCode}
          disabled={sending}
          style={[styles.button, sending && styles.buttonDisabled]}
        >
          {sending ? (
            <ActivityIndicator color="#FBCC33" />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#120E01",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(18, 14, 1, 0.6)",
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#120E01",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: "#120E01",
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.1)",
  },
  error: {
    color: "#E53E3E",
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(18, 14, 1, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#120E01",
    lineHeight: 20,
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
