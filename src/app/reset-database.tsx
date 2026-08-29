import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { resetDatabase } from "../database/web/database";

export default function ResetDatabaseRoute() {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (!confirm("This will delete all data. Are you sure?")) {
      return;
    }

    try {
      setResetting(true);
      setMessage("Resetting database...");

      await resetDatabase();

      setMessage("Database reset successfully! Redirecting...");

      // Clear localStorage for PIN and account store
      localStorage.clear();

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
        padding: 24,
        justifyContent: "center",
        gap: 24,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          Reset Database
        </Text>

        <Text
          style={{
            marginTop: 12,
            color: "#666",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          This will delete all data including profiles, accounts, transactions, and budgets.
        </Text>
      </View>

      {message ? (
        <Text
          style={{
            padding: 16,
            backgroundColor: "#f5f5f5",
            borderRadius: 12,
          }}
        >
          {message}
        </Text>
      ) : null}

      <Pressable
        onPress={handleReset}
        disabled={resetting}
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          backgroundColor: "#d00",
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
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#ddd",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}
