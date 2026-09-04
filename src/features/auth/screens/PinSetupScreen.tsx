import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { setPin as savePin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";

interface PinSetupScreenProps {
  onComplete?: () => void;
}

export function PinSetupScreen({ onComplete }: PinSetupScreenProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const clean = (value: string) => value.replace(/\D/g, "").slice(0, 4);

  const handleCreatePin = async () => {
    if (pin.length !== 4) {
      return setError("PIN must be 4 digits.");
    }

    if (confirmPin.length !== 4) {
      return setError("Confirm your 4-digit PIN.");
    }

    if (pin !== confirmPin) {
      return setError("PINs don't match.");
    }

    try {
      setSaving(true);
      setError("");

      await savePin(
        await requireCurrentUserId(),
        pin,
      );

      onComplete?.();
    } catch {
      setError("Unable to create PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Create Your{"\n"}PIN</Text>

        {/* Create PIN Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              value={pin}
              onChangeText={(value) => {
                setPin(clean(value));
                setError("");
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              style={styles.input}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* Confirm PIN Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              value={confirmPin}
              onChangeText={(value) => {
                setConfirmPin(clean(value));
                setError("");
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="Confirm 4-digit PIN"
              style={styles.input}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Create Button */}
        <Pressable
          onPress={handleCreatePin}
          disabled={saving}
          style={[
            styles.button,
            saving && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Creating..." : "Create PIN"}
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
