import { useEffect, useState } from "react";
import { router, useNavigation } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  Alert,
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
import { colors, screenStyles } from "../../../theme";

interface PendingExpense {
  amount: number;
  category: string;
  description?: string;
  date: string;
}

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
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Intercept Stack header back button
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const hasUnsavedExpenses =
        pendingExpenses.length > 0 ||
        amount ||
        category ||
        description;

      // If no unsaved data, allow navigation
      if (!hasUnsavedExpenses) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        "Discard expenses?",
        "You have unsaved expense information. Are you sure you want to leave?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard & Leave",
            style: "destructive",
            onPress: () => {
              // Clear all data
              setPendingExpenses([]);
              setAmount("");
              setCategory(null);
              setDescription("");

              // Allow navigation to proceed
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, pendingExpenses, amount, category, description]);

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

  const validateCurrentExpense = () => {
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

  const handleAddAnotherExpense = () => {
    const error = validateCurrentExpense();

    if (error) {
      console.log("VALIDATION ERROR:", error);
      return;
    }

    const newExpense: PendingExpense = {
      amount: Number(amount),
      category: category as string,
      description: description.trim() || undefined,
      date,
    };

    setPendingExpenses((currentExpenses) => [...currentExpenses, newExpense]);

    // Reset the form for the next expense
    setAmount("");
    setCategory(null);
    setDescription("");

    console.log("EXPENSE ADDED TO LIST:", newExpense);
  };

  const handleRemoveExpense = (indexToRemove: number) => {
    setPendingExpenses((currentExpenses) =>
      currentExpenses.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async () => {
    if (!currentAccountId) {
      console.log("VALIDATION ERROR: Please select an account.");
      return;
    }

    const expensesToSave = [...pendingExpenses];

    // Check whether the current form contains an expense
    const hasCurrentExpense = amount || category || description;

    if (hasCurrentExpense) {
      const error = validateCurrentExpense();

      if (error) {
        console.log("VALIDATION ERROR:", error);
        return;
      }

      expensesToSave.push({
        amount: Number(amount),
        category: category as string,
        description: description.trim() || undefined,
        date,
      });
    }

    // Nothing to save
    if (expensesToSave.length === 0) {
      console.log("VALIDATION ERROR: Please add an expense.");
      return;
    }

    try {
      setLoading(true);

      for (const expense of expensesToSave) {
        await createExpense({
          accountId: currentAccountId,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
        });
      }

      console.log(`${expensesToSave.length} EXPENSE(S) SAVED SUCCESSFULLY`);

      setPendingExpenses([]);
      setAmount("");
      setCategory(null);
      setDescription("");

      router.back();
    } catch (error) {
      console.error("FAILED TO ADD EXPENSES:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}
      <View>
        <Text style={screenStyles.title}>Add Expense</Text>

        <Text style={screenStyles.subtitle}>
          Track where your money goes.
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
      <CategorySelector value={category} onChange={setCategory} />

      {/* Description */}
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Description</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What did you spend on?"
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

      {/* Add Another Expense Button */}
      <Pressable
        onPress={handleAddAnotherExpense}
        style={screenStyles.outlineButton}
      >
        <Text style={screenStyles.outlineButtonText}>
          + Add Another Expense
        </Text>
      </Pressable>

      {/* Pending Expenses List */}
      {pendingExpenses.length > 0 && (
        <View style={screenStyles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={screenStyles.sectionTitle}>
              Expenses to Add ({pendingExpenses.length})
            </Text>
          </View>

          {pendingExpenses.map((expense, index) => (
            <View
              key={index}
              style={{
                paddingBottom: 12,
                borderBottomWidth:
                  index === pendingExpenses.length - 1
                    ? 0
                    : 1,
                borderBottomColor: colors.border,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {expense.category}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    ₦{expense.amount.toLocaleString()}
                  </Text>

                  <Pressable
                    onPress={() => handleRemoveExpense(index)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.error,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      ✕
                    </Text>
                  </Pressable>
                </View>
              </View>

              {expense.description && (
                <Text style={{ color: colors.textSecondary }}>
                  {expense.description}
                </Text>
              )}

              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                }}
              >
                {new Date(expense.date).toLocaleDateString()}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Total
            </Text>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              ₦
              {pendingExpenses
                .reduce(
                  (total, expense) =>
                    total + expense.amount,
                  0,
                )
                .toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        style={screenStyles.primaryButton}
      >
        <Text style={screenStyles.primaryButtonText}>
          {loading
            ? "Adding..."
            : pendingExpenses.length > 0
              ? `Add ${
                  pendingExpenses.length + (amount && category ? 1 : 0)
                } Expense${
                  pendingExpenses.length + (amount && category ? 1 : 0) === 1
                    ? ""
                    : "s"
                }`
              : "Add Expense"}
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
