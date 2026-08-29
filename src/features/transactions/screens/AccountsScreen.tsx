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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />

        <Text style={{ marginTop: 12 }}>Loading accounts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          My Accounts
        </Text>
        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
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
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Create New Account
        </Text>
      </Pressable>

      {accounts.length === 0 ? (
        <View
          style={{
            paddingVertical: 40,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#666",
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
