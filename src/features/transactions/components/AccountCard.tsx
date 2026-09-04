import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Account } from "../../../types/account";

import { getAccountBalance } from "../services/accountBalanceService";
import { colors } from "../../../theme";

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
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="wallet"
            size={20}
            color={selected ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.currencyCode}>{account.currencyCode}</Text>
        </View>
        {selected && (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Balance - Dashboard Style */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Balance</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.balanceAmount}>
            {currencySymbol}{balance?.toLocaleString() ?? "0"}
          </Text>
        )}
      </View>

      {/* Active Indicator */}
      {selected && (
        <View style={styles.activeBar} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  currencyCode: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  badge: {
    marginLeft: 8,
  },
  balanceSection: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  activeBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
});
