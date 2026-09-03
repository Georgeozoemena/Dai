import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Account } from "../../../types/account";

import { getAccountBalance } from "../services/accountBalanceService";
import { colors, radii } from "../../../theme";

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
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.secondary : colors.borderInput,
        borderRadius: radii.lg,
        padding: 20,
        backgroundColor: colors.surface,
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
            color={selected ? colors.primary : colors.textSecondary}
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
                color: colors.textSecondary,
              }}
            >
              {account.currencyCode}
            </Text>
          </View>
        </View>

        {selected && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.primary,
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
            color: colors.textSecondary,
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
