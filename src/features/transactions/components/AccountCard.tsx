import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Account } from "../../../types/account";

import { getAccountBalance } from "../services/accountBalanceService";

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onPress: () => void;
}

export function AccountCard({ account, selected, onPress }: AccountCardProps) {
  const [balance, setBalance] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalance() {
      try {
        setLoading(true);

        const result = await getAccountBalance(account.id);

        setBalance(result.balance);
      } catch (error) {
        console.error("Failed to load account balance:", error);

        setBalance(null);
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, [account.id]);

  const currencySymbol =
    account.currencyCode === "NGN"
      ? "₦"
      : account.currencyCode === "USD"
        ? "$"
        : account.currencyCode === "EUR"
          ? "€"
          : account.currencyCode;

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? "#111" : "#ddd",
        borderRadius: 16,
        padding: 20,
        backgroundColor: selected ? "#f5f5f5" : "#fff",
      }}
    >
      {/* Account information */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons 
            name={selected ? "wallet" : "wallet-outline"} 
            size={24} 
            color={selected ? "#111" : "#666"} 
          />
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {account.name}
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: "#666",
              }}
            >
              {account.currencyCode}
            </Text>
          </View>
        </View>

        {selected && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#4caf50",
              }}
            >
              Active
            </Text>
          </View>
        )}
      </View>

      {/* Balance */}

      <View
        style={{
          marginTop: 20,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: "#666",
          }}
        >
          Balance
        </Text>

        {loading ? (
          <ActivityIndicator
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
            }}
          />
        ) : (
          <Text
            style={{
              marginTop: 4,
              fontSize: 28,
              fontWeight: "700",
            }}
          >
            {currencySymbol}
            {balance?.toLocaleString() ?? "—"}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
