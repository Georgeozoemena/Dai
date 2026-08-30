import { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAccountStore } from "../../../store/account/accountStore";
import { CURRENCIES } from "../../../constants/currencies";
import { getAccount, updateAccount } from "../../accounts/services/accountService";
import type { Account } from "../../../types/account";

export function CurrencySettingsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load account on mount
  useEffect(() => {
    const loadAccount = async () => {
      if (!currentAccountId) {
        setLoading(false);
        return;
      }

      try {
        const account = await getAccount(currentAccountId);
        
        if (account) {
          setCurrentAccount(account);
          setSelectedCurrency(account.currencyCode);
        }
      } catch (error) {
        console.error("Failed to load account:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [currentAccountId]);

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
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  if (!currentAccount) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: "#666", textAlign: "center" }}>
          No account selected
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (selectedCurrency === currentAccount.currencyCode) {
      router.back();
      return;
    }

    try {
      setSaving(true);

      const updatedAccount = {
        ...currentAccount,
        currencyCode: selectedCurrency,
        updatedAt: new Date().toISOString(),
      };

      await updateAccount(updatedAccount);

      // Reload account to reflect changes
      const reloadedAccount = await getAccount(currentAccount.id);
      if (reloadedAccount) {
        setCurrentAccount(reloadedAccount);
      }

      Alert.alert(
        "Currency Updated",
        `Your account currency has been changed to ${selectedCurrency}.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("FAILED TO UPDATE CURRENCY:", error);

      Alert.alert(
        "Update Failed",
        "Could not update your currency. Please try again."
      );

      setSaving(false);
    }
  };

  const hasChanges = selectedCurrency !== currentAccount.currencyCode;

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
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          Currency Settings
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 15,
            color: "#666",
          }}
        >
          Choose the currency for "{currentAccount.name}"
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {CURRENCIES.map((currency) => {
          const isSelected = selectedCurrency === currency.code;

          return (
            <Pressable
              key={currency.code}
              onPress={() => setSelectedCurrency(currency.code)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 2,
                borderColor: isSelected ? "#111" : "#ddd",
                borderRadius: 14,
                padding: 16,
                backgroundColor: isSelected ? "#f9f9f9" : "#fff",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text
                  style={{
                    fontSize: 28,
                  }}
                >
                  {currency.symbol}
                </Text>

                <View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: isSelected ? "700" : "600",
                    }}
                  >
                    {currency.code}
                  </Text>

                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 14,
                      color: "#666",
                    }}
                  >
                    {currency.name}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#111" />
              )}
            </Pressable>
          );
        })}
      </View>

      {hasChanges && (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#ccc" : "#111",
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#fff",
              }}
            >
              Save Changes
            </Text>
          )}
        </Pressable>
      )}

      <View
        style={{
          marginTop: 12,
          padding: 16,
          backgroundColor: "#f9f9f9",
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            lineHeight: 20,
          }}
        >
          💡 Changing your currency will update how amounts are displayed
          throughout the app. Your existing transaction amounts will not be
          converted.
        </Text>
      </View>
    </ScrollView>
  );
}
