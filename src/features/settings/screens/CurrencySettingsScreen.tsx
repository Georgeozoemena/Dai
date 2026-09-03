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
import { colors, screenStyles } from "../../../theme";

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
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!currentAccount) {
    return (
      <View style={screenStyles.centered}>
        <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
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
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Currency Settings</Text>

        <Text style={screenStyles.subtitle}>
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
                borderColor: isSelected ? colors.secondary : colors.borderInput,
                borderRadius: 14,
                padding: 16,
                backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
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
                      color: colors.text,
                    }}
                  >
                    {currency.code}
                  </Text>

                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    {currency.name}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={colors.secondary} />
              )}
            </Pressable>
          );
        })}
      </View>

      {hasChanges && (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={screenStyles.primaryButtonText}>Save Changes</Text>
          )}
        </Pressable>
      )}

      <View style={screenStyles.card}>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
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
