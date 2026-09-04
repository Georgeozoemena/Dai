import { useCallback, useState } from "react";
import { 
  ActivityIndicator, 
  Pressable, 
  ScrollView, 
  Text, 
  View,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Account } from "../../../types/account";

import { getAccounts } from "../../../features/accounts/services/accountService";
import { selectAccount } from "../../../features/accounts/services/accountSelectionService";

import { getProfile } from "../../onboarding/services/profileService";

import { useAccountStore } from "../../../store/account/accountStore";

import { AccountCard } from "../components/AccountCard";
import { colors } from "../../../theme";

export function AccountsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  console.log("ACCOUNTS SCREEN - CURRENT ACCOUNT:", currentAccountId);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadAccounts() {
        try {
          setLoading(true);
          setError(null);

          const profile = await getProfile();

          if (!profile) {
            setError("No profile found.");
            return;
          }

          const profileAccounts = await getAccounts(profile.id);

          setAccounts(profileAccounts);

          /*
           * If there is no currently selected account,
           * select the first available account.
           */
          if (!currentAccountId && profileAccounts.length > 0) {
            selectAccount(profileAccounts[0]);
          }
        } catch (err) {
          console.error("Failed to load accounts:", err);

          setError("Unable to load your accounts.");
        } finally {
          setLoading(false);
        }
      }

      loadAccounts();
    }, [currentAccountId]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header Card */}
      {/* <View style={styles.headerCard}>
        <Ionicons name="wallet" size={28} color={colors.primary} />
        <Text style={styles.headerTitle}>My Accounts</Text>
        <Text style={styles.headerSubtitle}>
          Manage your financial accounts
        </Text>
      </View> */}

      {/* Create Account Button */}
      <Pressable
        onPress={async () => {
          const profile = await getProfile();
          if (profile) {
            router.push({
              pathname: "/create-account",
              params: {
                profileId: profile.id,
                returnTo: "accounts",
              },
            });
          }
        }}
        style={styles.createButton}
      >
        <Ionicons name="add-circle" size={20} color={colors.secondary} />
        <Text style={styles.createButtonText}>Create New Account</Text>
      </Pressable>

      {accounts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Accounts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first account to start tracking your finances
          </Text>
        </View>
      ) : (
        <View style={styles.accountsList}>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              selected={currentAccountId === account.id}
              onPress={() => {
                selectAccount(account);
                router.back();
              }}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    opacity: 0.8,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  accountsList: {
    gap: 12,
  },
});
