import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { verifyPin } from "../services/pinService";
import { requireCurrentUserId } from "../services/currentUserService";
import { colors, screenStyles } from "../../../theme";

interface PinLockScreenProps {
  onSuccess?: () => void;
}

export function PinLockScreen({
  onSuccess,
}: PinLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    setPin(cleaned);
    setError("");
  };

  const handleUnlock = async () => {
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }

    try {
      setChecking(true);
      setError("");

      const userId = await requireCurrentUserId();
      const valid = await verifyPin(userId, pin);

      if (!valid) {
        setError("Incorrect PIN.");
        setPin("");
        return;
      }

      console.log("PIN VERIFIED FOR USER:", userId);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("PIN VERIFICATION FAILED:", error);
      setError("Unable to verify PIN. Please try again.");
    } finally {
      setChecking(false);
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
        <Text style={screenStyles.title}>Welcome back</Text>

        <Text style={screenStyles.subtitle}>
          Enter your PIN to continue using Dai.
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
          placeholder="Enter PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          textAlign="center"
          autoFocus
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
          onPress={handleUnlock}
          disabled={checking}
          style={[
            screenStyles.primaryButton,
            {
              marginTop: 8,
              opacity: checking ? 0.5 : 1,
            },
          ]}
        >
          <Text style={screenStyles.primaryButtonText}>
            {checking ? "Checking..." : "Unlock Dai"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
