import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Account } from "../../../types/account";

import { getAccounts } from "../../../features/accounts/services/accountService";
import { selectAccount } from "../../../features/accounts/services/accountSelectionService";

import { getProfile } from "../../onboarding/services/profileService";

import { useAccountStore } from "../../../store/account/accountStore";

import { AccountCard } from "../components/AccountCard";
import { colors, screenStyles } from "../../../theme";

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
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading accounts...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={screenStyles.centered}>
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            color: colors.text,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>My Accounts</Text>
        <Text style={screenStyles.subtitle}>
          Choose the account you want to use.
        </Text>
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
        style={[
          screenStyles.primaryButton,
          {
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          },
        ]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={screenStyles.primaryButtonText}>Create New Account</Text>
      </Pressable>

      {accounts.length === 0 ? (
        <View style={screenStyles.emptyState}>
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            You don't have any accounts yet.{"\n"}
            Create one to get started.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
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
