import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { budgetCategories } from "../constants/budgetCategories";
import { useAccountStore } from "../../../store/account/accountStore";
import { 
  createBudget, 
  createBudgetCategory, 
  getBudget,
  deleteBudget 
} from "../services/budgetService";

import { router } from "expo-router";
import { colors, screenStyles } from "../../../theme";
import { generateId } from "../../../utils/id";

export function BudgetBuilderScreen() {
  const [step, setStep] = useState(1);

  const [budgetName, setBudgetName] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [monthlyIncome, setMonthlyIncome] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [categoryAmounts, setCategoryAmounts] = useState<
    Record<string, string>
  >({});

  const [saving, setSaving] = useState(false);
  
  const [checkingExisting, setCheckingExisting] = useState(false);
  
  const [existingBudgetId, setExistingBudgetId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  // No longer checking for existing budget - allow multiple budgets
  useEffect(() => {
    setCheckingExisting(false);
  }, [currentAccountId]);

  const nextStep = () => {
    if (step === 1) {
      if (!budgetName.trim()) {
        return;
      }
    }

    if (step === 2) {
      const income = Number(monthlyIncome);

      if (!income || income <= 0) {
        return;
      }
    }

    if (step === 3) {
      if (selectedCategories.length === 0) {
        return;
      }
    }

    if (step === 4) {
      const hasInvalidAmount = selectedCategories.some((category) => {
        const amount = Number(categoryAmounts[category]);

        return !amount || amount <= 0;
      });

      if (hasInvalidAmount) {
        return;
      }
    }

    setStep((currentStep) => Math.min(currentStep + 1, 6));
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

      // Delete existing budget if replacing (existingBudgetId would be set from edit flow)
      if (existingBudgetId) {
        await deleteBudget(existingBudgetId);
      }

      const now = new Date().toISOString();

      // Generate month/period identifier based on period type
      let monthIdentifier: string;
      const currentDate = new Date();
      
      switch (budgetPeriod) {
        case 'daily':
          monthIdentifier = currentDate.toISOString().slice(0, 10); // "2026-10-08"
          break;
        case 'weekly':
          // Get week number
          const weekNumber = getWeekNumber(currentDate);
          monthIdentifier = `${currentDate.getFullYear()}-W${weekNumber}`;
          break;
        case 'yearly':
          monthIdentifier = currentDate.getFullYear().toString(); // "2026"
          break;
        case 'monthly':
        default:
          monthIdentifier = currentDate.toISOString().slice(0, 7); // "2026-10"
          break;
      }

      const budgetId = generateId();

      const budget = {
        id: budgetId,
        accountId: currentAccountId,
        name: budgetName.trim(),
        period: budgetPeriod,
        month: monthIdentifier,
        totalIncome: income,
        totalBudget: totalBudgeted,
        createdAt: now,
        updatedAt: now,
      };

      await createBudget(budget);

      for (const category of selectedCategories) {
        const amount = Number(categoryAmounts[category]) || 0;

        await createBudgetCategory({
          id: generateId(),
          budgetId,
          category,
          amount,
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log("BUDGET CREATED:", budget);

      setStep(6);

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

  // Helper function to get week number
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Show loading while checking for existing budget
  if (checkingExisting) {
    return (
      <View style={[screenStyles.root, screenStyles.centered]}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Checking existing budget...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Build Your Budget</Text>

        <Text style={screenStyles.subtitle}>Step {step} of 6</Text>
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
            width: `${(step / 6) * 100}%`,
            height: "100%",
            backgroundColor: colors.primary,
          }}
        />
      </View>

      {/* STEP 1: Budget Name and Period */}

      {step === 1 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            Name your budget
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Give your budget a descriptive name.
          </Text>

          <TextInput
            value={budgetName}
            onChangeText={setBudgetName}
            placeholder="e.g. Monthly Expenses, Weekly Groceries"
            style={[screenStyles.input, { fontSize: 16 }]}
          />

          <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>
            Budget period
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            How often does this budget reset?
          </Text>

          <View style={{ gap: 12 }}>
            {[
              { value: 'daily' as const, label: 'Daily', desc: 'Resets every day' },
              { value: 'weekly' as const, label: 'Weekly', desc: 'Resets every week' },
              { value: 'monthly' as const, label: 'Monthly', desc: 'Resets every month' },
              { value: 'yearly' as const, label: 'Yearly', desc: 'Resets every year' },
            ].map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setBudgetPeriod(option.value)}
                style={[
                  {
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: budgetPeriod === option.value ? colors.secondary : colors.borderInput,
                    backgroundColor: budgetPeriod === option.value ? `${colors.secondary}10` : colors.surface,
                  }
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                      {option.label}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                      {option.desc}
                    </Text>
                  </View>
                  {budgetPeriod === option.value && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* STEP 2: Income */}

      {step === 2 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            What's your {budgetPeriod} income?
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Enter the amount you expect to earn for this {budgetPeriod} period.
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

      {/* STEP 3: Categories */}

      {step === 3 && (
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

      {/* STEP 4: Category Amounts */}

      {step === 4 && (
        <View style={{ gap: 16 }}>
          <Text style={screenStyles.sectionTitle}>
            Set your category budgets
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Decide how much you want to spend in each category for this {budgetPeriod} period.
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

      {/* STEP 5: Review */}

      {step === 5 && (
        <View style={{ gap: 20 }}>
          <View>
            <Text style={screenStyles.sectionTitle}>
              Review your budget
            </Text>

            <Text style={screenStyles.subtitle}>
              Here's how your money is planned for this {budgetPeriod} period.
            </Text>
          </View>

          {/* Budget Info */}
          <View style={screenStyles.card}>
            <Text style={{ color: colors.textSecondary }}>Budget Name</Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {budgetName}
            </Text>
            <Text style={{ marginTop: 8, color: colors.textSecondary }}>
              Period: {budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1)}
            </Text>
          </View>

          {/* Income */}

          <View style={screenStyles.card}>
            <Text style={{ color: colors.textSecondary }}>{budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1)} Income</Text>

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
              ⚠️ Your planned budget is higher than your {budgetPeriod} income.
            </Text>
          )}
        </View>
      )}

      {/* STEP 6: Success */}

      {step === 6 && (
        <View style={{ gap: 12 }}>
          <Text style={screenStyles.sectionTitle}>
            Your budget is ready 🎉
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            You're ready to start tracking your spending.
          </Text>
        </View>
      )}

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

        {step < 6 && (
          <Pressable
            onPress={step === 5 ? handleCreateBudget : nextStep}
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
                {step === 5 ? "Create Budget" : "Continue"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
