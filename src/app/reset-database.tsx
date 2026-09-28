import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { resetDatabase } from "../database/reset/resetDatabase";
import { colors, screenStyles } from "../theme";

function confirmReset(): Promise<boolean> {
  const message = "This will delete all data. Are you sure?";

  if (Platform.OS === "web") {
    return Promise.resolve(
      typeof window !== "undefined" &&
        window.confirm(message),
    );
  }

  return new Promise((resolve) => {
    Alert.alert("Reset Database", message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export default function ResetDatabaseRoute() {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (!(await confirmReset())) {
      return;
    }

    try {
      setResetting(true);
      setMessage("Resetting database...");

      await resetDatabase();

      setMessage("Database reset successfully! Redirecting...");

      // Clear localStorage for PIN and account store (web only)
      if (Platform.OS === "web") {
        localStorage.clear();
      }

      setTimeout(() => {
        router.replace("/");
      }, 1000);
    } catch (error) {
      console.error("Reset failed:", error);
      setMessage(`Reset failed: ${error}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: "center",
        gap: 24,
      }}
    >
      <View>
        <Text style={screenStyles.title}>Reset Database</Text>

        <Text style={screenStyles.subtitle}>
          This will delete all data including profiles, accounts, transactions, and budgets.
        </Text>
      </View>

      {message ? (
        <Text style={screenStyles.card}>{message}</Text>
      ) : null}

      <Pressable
        onPress={handleReset}
        disabled={resetting}
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          backgroundColor: colors.error,
          alignItems: "center",
          opacity: resetting ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {resetting ? "Resetting..." : "Reset Database"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={screenStyles.outlineButton}
      >
        <Text style={screenStyles.outlineButtonText}>Cancel</Text>
      </Pressable>
    </View>
  );
}
