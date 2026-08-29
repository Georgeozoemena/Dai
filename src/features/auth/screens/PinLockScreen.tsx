import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { verifyPin } from "../services/pinService";

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

      const valid = await verifyPin(pin);

      if (!valid) {
        setError("Incorrect PIN.");
        setPin("");
        return;
      }

      console.log("PIN VERIFIED");

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
          Welcome back
        </Text>

        <Text
          style={{
            color: "#666",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
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
          onPress={handleUnlock}
          disabled={checking}
          style={{
            marginTop: 8,
            backgroundColor: "#111",
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            opacity: checking ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {checking ? "Checking..." : "Unlock Dai"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
