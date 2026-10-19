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
import type { Account } from "../../../types/account";
import { useAccountStore } from "../../../store/account/accountStore";
import {
  getAccount,
  getAccounts,
} from "../../accounts/services/accountService";
import { getProfile } from "../../onboarding/services/profileService";
import { createIncome } from "../services/incomeService";
import { trackEvent } from "../../../services/analytics/analyticsService";
import { colors, screenStyles } from "../../../theme";
import { PageBackButton } from "../../../components/PageBackButton";

interface PendingIncome {
  amount: number;
  category: string;
  description?: string;
  date: string;
}

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
  const [pendingIncomes, setPendingIncomes] = useState<PendingIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    account?: string;
  }>({});

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

  // Intercept Stack header back button
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const hasUnsavedIncomes =
        pendingIncomes.length > 0 ||
        amount ||
        category ||
        description;

      // If no unsaved data, allow navigation
      if (!hasUnsavedIncomes) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        "Discard incomes?",
        "You have unsaved income information. Are you sure you want to leave?",
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
              setPendingIncomes([]);
              setAmount("");
              setCategory("");
              setDescription("");

              // Allow navigation to proceed
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, pendingIncomes, amount, category, description]);

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

  const validateCurrentIncome = () => {
    const newErrors: typeof errors = {};
    
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }

    if (!category.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAnotherIncome = () => {
    if (!validateCurrentIncome()) {
      return;
    }

    const newIncome: PendingIncome = {
      amount: Number(amount),
      category: category.trim(),
      description: description.trim() || undefined,
      date,
    };

    setPendingIncomes((currentIncomes) => [...currentIncomes, newIncome]);

    // Reset the form for the next income
    setAmount("");
    setCategory("");
    setDescription("");
    setErrors({});

    console.log("INCOME ADDED TO LIST:", newIncome);
  };

  const handleRemoveIncome = (indexToRemove: number) => {
    setPendingIncomes((currentIncomes) =>
      currentIncomes.filter((_, index) => index !== indexToRemove)
    );
  };

  const saveIncomes = async (incomesToSave: PendingIncome[]) => {
    if (!currentAccountId) {
      return;
    }

    try {
      setLoading(true);

      for (const income of incomesToSave) {
        await createIncome({
          accountId: currentAccountId,
          amount: income.amount,
          category: income.category,
          description: income.description,
          date: income.date,
        });
      }

      console.log(`${incomesToSave.length} INCOME(S) SAVED SUCCESSFULLY`);

      setPendingIncomes([]);
      setAmount("");
      setCategory("");
      setDescription("");

      router.back();
    } catch (error) {
      console.error("FAILED TO ADD INCOMES:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentAccountId) {
      setErrors({ account: "Please select an account" });
      return;
    }

    const incomesToSave = [...pendingIncomes];

    // Check whether the current form contains an income
    const hasCurrentIncome = amount || category || description;

    if (hasCurrentIncome) {
      if (!validateCurrentIncome()) {
        return;
      }

      incomesToSave.push({
        amount: Number(amount),
        category: category.trim(),
        description: description.trim() || undefined,
        date,
      });
    }

    // Nothing to save
    if (incomesToSave.length === 0) {
      setErrors({ amount: "Please add at least one income" });
      return;
    }

    await saveIncomes(incomesToSave);
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <PageBackButton onPress={() => router.replace("/(tabs)")} />
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
              borderColor: errors.account ? colors.error : (currentAccountId ? colors.borderInput : colors.error),
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
        
        {errors.account && (
          <Text style={{ color: colors.error, fontSize: 13, marginTop: 4 }}>
            {errors.account}
          </Text>
        )}
      </View>

      {/* Amount */}

      <View>
        <AmountInput
          currencySymbol={currencySymbol}
          value={amount}
          onChange={(value) => {
            setAmount(value);
            if (errors.amount) {
              setErrors({ ...errors, amount: undefined });
            }
          }}
        />
        {errors.amount && (
          <Text style={{ color: colors.error, fontSize: 13, marginTop: 4 }}>
            {errors.amount}
          </Text>
        )}
      </View>

      {/* Category */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Category</Text>

        <TextInput
          value={category}
          onChangeText={(value) => {
            setCategory(value);
            if (errors.category) {
              setErrors({ ...errors, category: undefined });
            }
          }}
          placeholder="Salary, freelance, gift..."
          style={[
            screenStyles.input,
            errors.category && { borderColor: colors.error }
          ]}
        />
        {errors.category && (
          <Text style={{ color: colors.error, fontSize: 13 }}>
            {errors.category}
          </Text>
        )}
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

      {/* Add Another Income Button */}
      <Pressable
        onPress={handleAddAnotherIncome}
        style={screenStyles.outlineButton}
      >
        <Text style={screenStyles.outlineButtonText}>
          + Add Another Income
        </Text>
      </Pressable>

      {/* Pending Incomes List */}
      {pendingIncomes.length > 0 && (
        <View style={screenStyles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={screenStyles.sectionTitle}>
              Incomes to Add ({pendingIncomes.length})
            </Text>
          </View>

          {pendingIncomes.map((income, index) => (
            <View
              key={index}
              style={{
                paddingBottom: 12,
                borderBottomWidth:
                  index === pendingIncomes.length - 1
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
                  {income.category}
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
                      color: colors.success,
                    }}
                  >
                    +{currencySymbol}{income.amount.toLocaleString()}
                  </Text>

                  <Pressable
                    onPress={() => handleRemoveIncome(index)}
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

              {income.description && (
                <Text style={{ color: colors.textSecondary }}>
                  {income.description}
                </Text>
              )}

              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                }}
              >
                {new Date(income.date).toLocaleDateString()}
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
                color: colors.success,
              }}
            >
              +{currencySymbol}
              {pendingIncomes
                .reduce(
                  (total, income) =>
                    total + income.amount,
                  0,
                )
                .toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Submit */}

      <Pressable onPress={handleSubmit} style={screenStyles.primaryButton}>
        <Text style={screenStyles.primaryButtonText}>
          {loading
            ? "Adding..."
            : pendingIncomes.length > 0
              ? `Add ${
                  pendingIncomes.length + (amount && category ? 1 : 0)
                } Income${
                  pendingIncomes.length + (amount && category ? 1 : 0) === 1
                    ? ""
                    : "s"
                }`
              : "Add Income"}
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
                      if (currentAccountId !== account.id) {
                        trackEvent("account_switched");
                      }

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
