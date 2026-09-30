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
import { colors } from "../../../theme";

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
        {/* Illustration - Key with Question Mark (Ghost Style) */}
        <View style={styles.illustrationContainer}>
          {/* Decorative elements */}
          <View style={styles.decorativeLeft}>
            <View style={styles.decorativePill} />
          </View>
          <View style={styles.decorativeRight}>
            <View style={styles.decorativePill} />
          </View>

          {/* Main key illustration */}
          <View style={styles.keyBody}>
            {/* Key head (circle with question mark) */}
            <View style={styles.keyHead}>
              <Text style={styles.questionMarkText}>?</Text>
            </View>

            {/* Key shaft */}
            <View style={styles.keyShaft} />

            {/* Key teeth */}
            <View style={styles.keyTeeth}>
              <View style={styles.tooth} />
              <View style={[styles.tooth, { height: 16 }]} />
              <View style={[styles.tooth, { height: 12 }]} />
            </View>
          </View>

          {/* Floating dots */}
          <View style={[styles.floatingDot, { top: 20, left: 30 }]} />
          <View style={[styles.floatingDot, { top: 40, right: 40 }]} />
          <View style={[styles.floatingDot, { bottom: 30, left: 50 }]} />
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
            placeholderTextColor="rgba(18, 14, 1, 0.3)"
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
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 48,
    height: 160,
    justifyContent: "center",
    position: "relative",
  },
  decorativeLeft: {
    position: "absolute",
    left: 20,
    top: 40,
  },
  decorativeRight: {
    position: "absolute",
    right: 20,
    top: 40,
  },
  decorativePill: {
    width: 32,
    height: 48,
    backgroundColor: "rgba(18, 14, 1, 0.06)",
    borderRadius: 16,
  },
  keyBody: {
    alignItems: "center",
    position: "relative",
  },
  keyHead: {
    width: 80,
    height: 80,
    backgroundColor: "#120E01",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -8,
    zIndex: 2,
  },
  questionMarkText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FBCC33",
  },
  keyShaft: {
    width: 40,
    height: 50,
    backgroundColor: "#120E01",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
  },
  keyTeeth: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-end",
  },
  tooth: {
    width: 8,
    height: 20,
    backgroundColor: "#120E01",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  floatingDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(251, 204, 51, 0.3)",
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#120E01",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: "#120E01",
    borderWidth: 1.5,
    borderColor: "rgba(18, 14, 1, 0.15)",
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
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.1)",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(18, 14, 1, 0.7)",
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
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
