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
import { LinearGradient } from "expo-linear-gradient";

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
      {/* Dark Background Header */}
      <LinearGradient
        colors={['#1a1612', '#120E01']}
        style={styles.headerGradient}
      >
        <Pressable onPress={onCancel} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
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
          {/* Input Section */}
          <View>
            <Text style={styles.inputLabel}>Email or phone number</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              placeholder="georgeozoemena@gmail.com"
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

          {/* Continue Button */}
          <Pressable
            onPress={handleSendCode}
            disabled={sending}
            style={[styles.button, sending && styles.buttonDisabled]}
          >
            {sending ? (
              <ActivityIndicator color="#FBCC33" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>

          {/* Info Message */}
          <View style={styles.infoBox}>
            <Ionicons name="mail-outline" size={48} color="#120E01" />
            <Text style={styles.infoTitle}>Check your email</Text>
            <Text style={styles.infoText}>
              We will send you email with instructions on how to reset your password
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#120E01",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: "#120E01",
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.1)",
    marginBottom: 24,
  },
  error: {
    color: "#E53E3E",
    fontSize: 13,
    marginTop: -16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FBCC33",
  },
  infoBox: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#120E01",
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(18, 14, 1, 0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
});
