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
import { CategorySelector } from "../components/CategorySelector";

import type { ExpenseCategory } from "../constants/expenseCategories";
import type { Account } from "../../../types/account";

import { useAccountStore } from "../../../store/account/accountStore";
import { getAccount } from "../../../services/accountService";
import { getAccounts } from "../../accounts/services/accountService";
import { getProfile } from "../../onboarding/services/profileService";

import { createExpense } from "../services/expenseService";
import { getTransactions } from "../services/transactionService";

export function ExpenseScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const setCurrentAccount = useAccountStore((state) => state.setCurrentAccount);

  const [currencySymbol, setCurrencySymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
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

    if (!category) {
      return "Please select a category.";
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
      const transaction = await createExpense({
        accountId: currentAccountId,
        amount: Number(amount),
        category,
        description,
        date,
      });

      console.log("EXPENSE CREATED:", transaction);

      const transactions = await getTransactions(currentAccountId);

      console.log("ACCOUNT TRANSACTIONS:", transactions);
    } catch (error) {
      console.error("FAILED TO CREATE EXPENSE:", error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 28,
      }}
    >
      {/* Header */}
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Add Expense
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          Track where your money goes.
        </Text>
      </View>

      {/* Account */}
      <View>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
          }}
        >
          Current account
        </Text>

        <TouchableOpacity
          onPress={() => setShowAccountPicker(true)}
          style={{
            marginTop: 4,
            padding: 12,
            borderWidth: 1,
            borderColor: currentAccountId ? "#ddd" : "#f00",
            borderRadius: 12,
            backgroundColor: "#f9f9f9",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: currentAccountId ? "#000" : "#999",
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
      <CategorySelector value={category} onChange={setCategory} />

      {/* Description */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Description
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What did you spend on?"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Date */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Date
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text>{new Date(date).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        style={{
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Add Expense
        </Text>
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
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                Select Account
              </Text>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }}>
              {accounts.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <Text style={{ color: "#999" }}>
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
                      borderBottomColor: "#eee",
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
                          color: "#666",
                          marginTop: 2,
                        }}
                      >
                        {account.currencyCode}
                      </Text>
                    </View>
                    {currentAccountId === account.id && (
                      <Text style={{ fontSize: 20 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAccountPicker(false)}
              style={{
                marginTop: 16,
                marginHorizontal: 24,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: "#f5f5f5",
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
