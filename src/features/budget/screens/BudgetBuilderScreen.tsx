import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { budgetCategories } from "../constants/budgetCategories";
import { useAccountStore } from "../../../store/account/accountStore";
import { createBudget, createBudgetCategory } from "../services/budgetService";

import { router } from "expo-router";
import { colors, screenStyles } from "../../../theme";

export function BudgetBuilderScreen() {
  const [step, setStep] = useState(1);

  const [monthlyIncome, setMonthlyIncome] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [categoryAmounts, setCategoryAmounts] = useState<
    Record<string, string>
  >({});

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  const nextStep = () => {
    if (step === 1) {
      const income = Number(monthlyIncome);

      if (!income || income <= 0) {
        return;
      }
    }

    if (step === 2) {
      if (selectedCategories.length === 0) {
        return;
      }
    }

    if (step === 3) {
      const hasInvalidAmount = selectedCategories.some((category) => {
        const amount = Number(categoryAmounts[category]);

        return !amount || amount <= 0;
      });

      if (hasInvalidAmount) {
        return;
      }
    }

    setStep((currentStep) => Math.min(currentStep + 1, 5));
  };

  const previousStep = () => {
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((currentCategories) => {
      if (currentCategories.includes(category)) {
        return currentCategories.filter((item) => item !== category);
      }

      return [...currentCategories, category];
    });
  };

  const income = Number(monthlyIncome) || 0;

  const totalBudgeted = selectedCategories.reduce((total, category) => {
    return total + (Number(categoryAmounts[category]) || 0);
  }, 0);

  const remainingIncome = income - totalBudgeted;

  const handleCreateBudget = async () => {
    if (!currentAccountId) {
      setError("Please select an account before creating a budget.");

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const now = new Date().toISOString();

      const month = new Date().toISOString().slice(0, 7);

      const budgetId = crypto.randomUUID();

      const budget = {
        id: budgetId,
        accountId: currentAccountId,
        month,
        totalIncome: income,
        totalBudget: totalBudgeted,
        createdAt: now,
        updatedAt: now,
      };

      await createBudget(budget);

      for (const category of selectedCategories) {
        const amount = Number(categoryAmounts[category]) || 0;

        await createBudgetCategory({
          id: crypto.randomUUID(),
          budgetId,
          category,
          amount,
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log("BUDGET CREATED:", budget);

      setStep(5);

      setTimeout(() => {
        router.replace("/(tabs)/budget");
      }, 1500);
    } catch (error) {
      console.error("FAILED TO CREATE BUDGET:", error);

      setError("Unable to create your budget. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Build Your Budget</Text>

        <Text style={screenStyles.subtitle}>Step {step} of 5</Text>
      </View>

      {/* Progress */}

      <View
        style={{
          height: 8,
          backgroundColor: colors.borderInput,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${(step / 5) * 100}%`,
            height: "100%",
            backgroundColor: colors.primary,
          }}
        />
      </View>

      {/* STEP 1 */}

      {step === 1 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            What's your monthly income?
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Enter the amount you expect to earn this month.
          </Text>

          <TextInput
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="decimal-pad"
            placeholder="0.00"
            style={[screenStyles.input, { fontSize: 20 }]}
          />
        </View>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            What do you spend money on?
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Select the categories you want to include in your budget.
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {budgetCategories.map((category) => {
              const selected = selectedCategories.includes(category);

              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={screenStyles.filterPill(selected)}
                >
                  <Text style={screenStyles.filterPillText(selected)}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* STEP 3 */}

      {step === 3 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            Set your category budgets
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Decide how much you want to spend in each category this month.
          </Text>

          {selectedCategories.length === 0 ? (
            <Text style={{ color: colors.error }}>
              You haven't selected any categories. Go back and select at least
              one.
            </Text>
          ) : (
            selectedCategories.map((category) => (
              <View
                key={category}
                style={[screenStyles.card, { gap: 8 }]}
              >
                <Text style={screenStyles.label}>{category}</Text>

                <TextInput
                  value={categoryAmounts[category] ?? ""}
                  onChangeText={(value) =>
                    setCategoryAmounts((current) => ({
                      ...current,
                      [category]: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  style={screenStyles.input}
                />
              </View>
            ))
          )}
        </View>
      )}

      {/* STEP 4 */}

      {step === 4 && (
        <View style={{ gap: 20 }}>
          <View>
            <Text style={screenStyles.sectionTitle}>
              Review your budget
            </Text>

            <Text style={screenStyles.subtitle}>
              Here's how your money is planned for this month.
            </Text>
          </View>

          {/* Income */}

          <View style={screenStyles.card}>
            <Text style={{ color: colors.textSecondary }}>Monthly Income</Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              ₦{income.toLocaleString()}
            </Text>
          </View>

          {/* Categories */}

          <View style={{ gap: 12 }}>
            <Text style={screenStyles.sectionTitle}>Your Budget</Text>

            <View style={screenStyles.listCard}>
              {selectedCategories.map((category, index) => {
                const amount = Number(categoryAmounts[category]) || 0;
                const isLast = index === selectedCategories.length - 1;

                return (
                  <View
                    key={category}
                    style={[
                      screenStyles.listItem(isLast),
                      { justifyContent: "space-between" },
                    ]}
                  >
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      {category}
                    </Text>

                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      ₦{amount.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Summary */}

          <View style={[screenStyles.card, { gap: 14 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.text }}>Total Budgeted</Text>

              <Text
                style={{
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                ₦{totalBudgeted.toLocaleString()}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.text }}>Remaining</Text>

              <Text
                style={{
                  fontWeight: "700",
                  color: remainingIncome < 0 ? colors.error : colors.text,
                }}
              >
                ₦{remainingIncome.toLocaleString()}
              </Text>
            </View>
          </View>

          {remainingIncome < 0 && (
            <Text
              style={{
                color: colors.error,
                fontWeight: "600",
              }}
            >
              ⚠️ Your planned budget is higher than your monthly income.
            </Text>
          )}
        </View>
      )}

      {/* STEP 5 */}

      {step === 5 && (
        <View style={{ gap: 12 }}>
          <Text style={screenStyles.sectionTitle}>
            Your budget is ready 🎉
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            You're ready to start tracking your spending.
          </Text>
        </View>
      )}

      {/* Navigation */}

      {error && (
        <Text
          style={{
            color: colors.error,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {step > 1 ? (
          <Pressable
            onPress={previousStep}
            style={[screenStyles.outlineButton, { flex: 1 }]}
          >
            <Text style={screenStyles.outlineButtonText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {step < 5 && (
          <Pressable
            onPress={step === 4 ? handleCreateBudget : nextStep}
            disabled={saving}
            style={[
              screenStyles.primaryButton,
              { flex: 1, opacity: saving ? 0.5 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={screenStyles.primaryButtonText}>
                {step === 4 ? "Create Budget" : "Continue"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
