import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, Alert, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { Account } from "../../../types/account";

import { getAccountBalance } from "../services/accountBalanceService";
import { colors } from "../../../theme";

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onPress: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, selected, onPress, onDelete }: AccountCardProps) {
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

  const handleDelete = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Delete "${account.name}"?\n\nThis will permanently delete this account and all its transactions. This action cannot be undone.`
      );
      
      if (confirmed) {
        onDelete();
      }
    } else {
      Alert.alert(
        "Delete Account?",
        `This will permanently delete "${account.name}" and all its transactions. This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]
      );
    }
  };

  // Active Account Card - Dark Background
  if (selected) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.cardContainer}
      >
        <View style={styles.darkBackground}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.checkmarkIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
            <Pressable onPress={handleDelete} hitSlop={12}>
              <Ionicons name="close-circle" size={24} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          </View>

          {/* Account Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.activeAccountName}>{account.name}</Text>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.activeBalance}>
                {currencySymbol}{balance?.toLocaleString() ?? "0"}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  // Inactive Account Card - Clean White
  return (
    <Pressable
      onPress={onPress}
      style={styles.inactiveCardContainer}
    >
      {/* Header Row */}
      <View style={styles.inactiveHeaderRow}>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet" size={22} color="#120E01" />
        </View>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Ionicons name="close-circle" size={24} color="rgba(18, 14, 1, 0.4)" />
        </Pressable>
      </View>

      {/* Account Details */}
      <View style={styles.inactiveDetailsSection}>
        <Text style={styles.inactiveAccountName}>{account.name}</Text>
        {loading ? (
          <ActivityIndicator color="#120E01" size="small" style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.inactiveBalance}>
            {currencySymbol}{balance?.toLocaleString() ?? "0"}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.inactiveFooter}>
        <Text style={styles.switchText}>Tap to switch</Text>
        <Ionicons name="chevron-forward" size={16} color="rgba(18, 14, 1, 0.3)" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Active Account Card - Dark Background
  cardContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  darkBackground: {
    backgroundColor: "#120E01",
    padding: 24,
    paddingTop: 28,
    paddingBottom: 32,
    minHeight: 180,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  checkmarkIcon: {
    opacity: 0.9,
  },
  detailsSection: {
    flex: 1,
    justifyContent: "center",
  },
  activeAccountName: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  activeBalance: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },

  // Inactive Account Card - Clean White
  inactiveCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    minHeight: 190,
    borderWidth: 1,
    borderColor: "rgba(18, 14, 1, 0.08)",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inactiveHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(18, 14, 1, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveDetailsSection: {
    marginBottom: 24,
  },
  inactiveAccountName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#120E01",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inactiveBalance: {
    fontSize: 32,
    fontWeight: "700",
    color: "#120E01",
    letterSpacing: -0.5,
  },
  inactiveFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(18, 14, 1, 0.5)",
    letterSpacing: 0.1,
  },
});
