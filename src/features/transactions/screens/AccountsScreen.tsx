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

import { getAccounts, deleteAccount } from "../../../features/accounts/services/accountService";
import { selectAccount } from "../../../features/accounts/services/accountSelectionService";
import { trackEvent } from "../../../services/analytics/analyticsService";

import { getProfile } from "../../onboarding/services/profileService";

import { useAccountStore } from "../../../store/account/accountStore";

import { AccountCard } from "../components/AccountCard";
import { colors } from "../../../theme";

export function AccountsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const clearCurrentAccount = useAccountStore((state) => state.clearCurrentAccount);

  console.log("ACCOUNTS SCREEN - CURRENT ACCOUNT:", currentAccountId);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getProfile();

      if (!profile) {
        setError("No profile found.");
        return;
      }

      const profileAccounts = await getAccounts(profile.id);

      // Sort accounts: active account first, then others
      const sortedAccounts = [...profileAccounts].sort((a, b) => {
        if (a.id === currentAccountId) return -1;
        if (b.id === currentAccountId) return 1;
        return 0;
      });

      setAccounts(sortedAccounts);

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
  }, [currentAccountId]);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setDeleting(accountId);

      // Delete the account
      await deleteAccount(accountId);

      trackEvent("account_deleted");

      // If this was the current account, clear selection
      if (currentAccountId === accountId) {
        clearCurrentAccount();
      }

      // Reload accounts
      await loadAccounts();
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError("Unable to delete account.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, styles.errorContainer]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable onPress={loadAccounts} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          accounts.length === 0 && styles.scrollContentEmpty
        ]}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyStateContainer}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="wallet-outline" size={64} color={colors.secondary} />
              </View>
              <View style={styles.illustrationDecor1} />
              <View style={styles.illustrationDecor2} />
            </View>

            {/* Content */}
            <View style={styles.emptyStateContent}>
              <Text style={styles.emptyStateTitle}>No Accounts Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Create your first account to start tracking your finances. You can add multiple accounts for better organization.
              </Text>
            </View>

            {/* CTA */}
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
              style={styles.createAccountButtonLarge}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.createAccountButtonLargeText}>Create Account</Text>
            </Pressable>
          </View>
        ) : (
          /* Accounts List */
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>My Accounts</Text>
                <Text style={styles.headerSubtitle}>
                  {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                </Text>
              </View>
            </View>

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
              style={styles.createAccountButton}
            >
              <Ionicons name="add" size={20} color={colors.secondary} />
              <Text style={styles.createAccountButtonText}>Add New Account</Text>
            </Pressable>

            {/* Active Account Section */}
            {currentAccountId && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {accounts.length === 1 ? "YOUR ACCOUNT" : "ACTIVE ACCOUNT"}
                </Text>
              </View>
            )}

            {/* Accounts List */}
            <View style={styles.accountsList}>
              {accounts.map((account, index) => {
                const isActive = currentAccountId === account.id;
                const showOtherAccountsLabel = index === 1 && currentAccountId && accounts.length > 1;
                
                return (
                  <View key={account.id}>
                    {/* Other Accounts Section Label */}
                    {showOtherAccountsLabel && (
                      <View style={[styles.section, { marginTop: 24, marginBottom: 12 }]}>
                        <Text style={styles.sectionLabel}>OTHER ACCOUNTS</Text>
                      </View>
                    )}
                    
                    <View style={{ opacity: deleting === account.id ? 0.5 : 1 }}>
                      <AccountCard
                        account={account}
                        selected={isActive}
                        onPress={() => {
                          if (deleting) return;

                          if (currentAccountId !== account.id) {
                            trackEvent("account_switched");
                          }

                          selectAccount(account);
                          router.back();
                        }}
                        onDelete={() => handleDeleteAccount(account.id)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  errorContainer: {
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 24,
    // borderWidth: 1.5,
    // borderColor: colors.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 8,
  },
  createAccountButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createAccountButtonLargeText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  accountsList: {
    gap: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    position: "relative",
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#F8F9FA",
  },
  illustrationDecor1: {
    position: "absolute",
    left: -20,
    top: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary + "20",
  },
  illustrationDecor2: {
    position: "absolute",
    right: -20,
    bottom: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary + "30",
  },
  emptyStateContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
});
