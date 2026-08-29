import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { setPin } from "../services/pinService";

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

      await setPin(pin);

      console.log("PIN CREATED");

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
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Create your PIN
        </Text>

        <Text
          style={{
            color: "#666",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
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
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            paddingVertical: 16,
            fontSize: 24,
            letterSpacing: 12,
          }}
        />

        <TextInput
          value={confirmPin}
          onChangeText={handleConfirmChange}
          placeholder="Confirm PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          textAlign="center"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            paddingVertical: 16,
            fontSize: 24,
            letterSpacing: 12,
          }}
        />

        {error ? (
          <Text
            style={{
              color: "#d00",
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleCreatePin}
          disabled={saving}
          style={{
            marginTop: 8,
            backgroundColor: "#111",
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            opacity: saving ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {saving ? "Creating PIN..." : "Create PIN"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
