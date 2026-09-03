import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";

import { AmountInput } from "../components/AmountInput";
import type { Account } from "../../../types/account";
import { useAccountStore } from "../../../store/account/accountStore";
import {
  getAccount,
  getAccounts,
} from "../../accounts/services/accountService";
import { getProfile } from "../../onboarding/services/profileService";
import { createIncome } from "../services/incomeService";
import { colors, screenStyles } from "../../../theme";

export function IncomeScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const setCurrentAccount = useAccountStore((state) => state.setCurrentAccount);

  const [currencySymbol, setCurrencySymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [currentAccount, setCurrentAccountData] = useState<Account | null>(
    null,
  );

  useEffect(() => {
    async function loadAccounts() {
      const profile = await getProfile();
      if (!profile) return;

      const allAccounts = await getAccounts(profile.id);
      setAccounts(allAccounts);
    }

    loadAccounts();
  }, []);

  useEffect(() => {
    async function loadAccount() {
      if (!currentAccountId) {
        setCurrencySymbol("");
        setCurrentAccountData(null);
        return;
      }

      const account = await getAccount(currentAccountId);

      if (!account) {
        setCurrencySymbol("");
        setCurrentAccountData(null);
        return;
      }

      setCurrentAccountData(account);

      if (account.currencyCode === "NGN") {
        setCurrencySymbol("₦");
      } else if (account.currencyCode === "USD") {
        setCurrencySymbol("$");
      } else if (account.currencyCode === "EUR") {
        setCurrencySymbol("€");
      } else {
        setCurrencySymbol(account.currencyCode);
      }
    }

    loadAccount();
  }, [currentAccountId]);

  const validateForm = () => {
    if (!currentAccountId) {
      return "Please select an account.";
    }

    if (!amount) {
      return "Please enter an amount.";
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return "Amount must be greater than 0.";
    }

    if (!category.trim()) {
      return "Please enter an income category.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();

    if (error) {
      console.log("VALIDATION ERROR:", error);

      return;
    }

    try {
      const transaction = await createIncome({
        accountId: currentAccountId!,
        amount: Number(amount),
        category: category.trim(),
        description,
        date,
      });

      console.log("INCOME CREATED:", transaction);

      setAmount("");
      setCategory("");
      setDescription("");
    } catch (error) {
      console.error("FAILED TO CREATE INCOME:", error);
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Add Income</Text>

        <Text style={screenStyles.subtitle}>
          Track money coming into your account.
        </Text>
      </View>

      {/* Account */}

      <View>
        <Text style={[screenStyles.label, { fontSize: 14, color: colors.textSecondary }]}>
          Current account
        </Text>

        <TouchableOpacity
          onPress={() => setShowAccountPicker(true)}
          style={[
            screenStyles.input,
            {
              marginTop: 4,
              borderColor: currentAccountId ? colors.borderInput : colors.error,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: currentAccountId ? colors.text : colors.textMuted,
            }}
          >
            {currentAccount
              ? `${currentAccount.name} (${currencySymbol})`
              : "Tap to select account"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}

      <AmountInput
        currencySymbol={currencySymbol}
        value={amount}
        onChange={setAmount}
      />

      {/* Category */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Category</Text>

        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Salary, freelance, gift..."
          style={screenStyles.input}
        />
      </View>

      {/* Description */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Description</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Where did this money come from?"
          style={screenStyles.input}
        />
      </View>

      {/* Date */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Date</Text>

        <View style={screenStyles.input}>
          <Text>{new Date(date).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Submit */}

      <Pressable onPress={handleSubmit} style={screenStyles.primaryButton}>
        <Text style={screenStyles.primaryButtonText}>Add Income</Text>
      </Pressable>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: "flex-end",
          }}
        >
          <View style={screenStyles.modalSheet}>
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={screenStyles.sectionTitle}>Select Account</Text>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }}>
              {accounts.length === 0 ? (
                <View style={screenStyles.emptyState}>
                  <Text style={{ color: colors.textMuted }}>
                    No accounts found. Create one first.
                  </Text>
                </View>
              ) : (
                accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => {
                      setCurrentAccount(account.id);
                      setShowAccountPicker(false);
                    }}
                    style={{
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {account.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {account.currencyCode}
                      </Text>
                    </View>
                    {currentAccountId === account.id && (
                      <Text style={{ fontSize: 20, color: colors.primary }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAccountPicker(false)}
              style={[screenStyles.outlineButton, { marginTop: 16, marginHorizontal: 24 }]}
            >
              <Text style={screenStyles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
