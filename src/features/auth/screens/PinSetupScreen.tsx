import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { setPin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";
import { colors, screenStyles } from "../../../theme";

interface PinSetupScreenProps {
  onComplete?: () => void;
}

export function PinSetupScreen({
  onComplete,
}: PinSetupScreenProps) {
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    setPinValue(cleaned);
    setError("");
  };

  const handleConfirmChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    setConfirmPin(cleaned);
    setError("");
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    if (confirmPin.length !== 4) {
      setError("Please confirm your PIN.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const userId = await requireCurrentUserId();
      await setPin(userId, pin);

      console.log("PIN CREATED FOR USER:", userId);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("FAILED TO CREATE PIN:", error);
      setError("Unable to create PIN. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.title}>Create your PIN</Text>

        <Text style={screenStyles.subtitle}>
          Create a 4-digit PIN to protect your Dai account.
        </Text>
      </View>

      <View
        style={{
          marginTop: 32,
          gap: 16,
        }}
      >
        <TextInput
          value={pin}
          onChangeText={handlePinChange}
          placeholder="Enter 4-digit PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          textAlign="center"
          style={[
            screenStyles.input,
            {
              fontSize: 24,
              letterSpacing: 12,
              paddingVertical: 16,
            },
          ]}
        />

        <TextInput
          value={confirmPin}
          onChangeText={handleConfirmChange}
          placeholder="Confirm PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          textAlign="center"
          style={[
            screenStyles.input,
            {
              fontSize: 24,
              letterSpacing: 12,
              paddingVertical: 16,
            },
          ]}
        />

        {error ? (
          <Text
            style={{
              color: colors.error,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleCreatePin}
          disabled={saving}
          style={[
            screenStyles.primaryButton,
            {
              marginTop: 8,
              opacity: saving ? 0.5 : 1,
            },
          ]}
        >
          <Text style={screenStyles.primaryButtonText}>
            {saving ? "Creating PIN..." : "Create PIN"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
