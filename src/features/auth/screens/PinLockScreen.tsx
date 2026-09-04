import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { verifyPin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export function PinLockScreen({ onSuccess }: PinLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handlePinChange = (value: string) => {
    setPin(value.replace(/\D/g, "").slice(0, 4));
    setError("");
  };

  const handleUnlock = async () => {
    if (pin.length !== 4) {
      return setError("Enter your 4-digit PIN.");
    }

    try {
      setChecking(true);
      setError("");

      const valid = await verifyPin(
        await requireCurrentUserId(),
        pin,
      );

      if (!valid) {
        setError("Incorrect PIN. Try again.");
        setPin("");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Unable to verify PIN.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Enter Your{"\n"}PIN</Text>

        {/* PIN Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
              placeholder="Enter 4-digit PIN"
              style={styles.input}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Unlock Button */}
        <Pressable
          onPress={handleUnlock}
          disabled={checking}
          style={[
            styles.button,
            checking && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {checking ? "Verifying..." : "Unlock"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 40,
    lineHeight: 44,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    letterSpacing: 8,
  },
  error: {
    color: "#E53E3E",
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: "#120E01",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FBCC33",
    letterSpacing: 0.3,
  },
});
