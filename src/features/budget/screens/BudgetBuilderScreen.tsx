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
      contentContainerStyle={{
        padding: 24,
        gap: 24,
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
          Build Your Budget
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          Step {step} of 5
        </Text>
      </View>

      {/* Progress */}

      <View
        style={{
          height: 8,
          backgroundColor: "#eee",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${(step / 5) * 100}%`,
            height: "100%",
            backgroundColor: "#111",
          }}
        />
      </View>

      {/* STEP 1 */}

      {step === 1 && (
        <View style={{ gap: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            What's your monthly income?
          </Text>

          <Text
            style={{
              color: "#666",
            }}
          >
            Enter the amount you expect to earn this month.
          </Text>

          <TextInput
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="decimal-pad"
            placeholder="0.00"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 20,
            }}
          />
        </View>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <View style={{ gap: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            What do you spend money on?
          </Text>

          <Text
            style={{
              color: "#666",
            }}
          >
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
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    backgroundColor: selected ? "#111" : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "#fff" : "#111",
                      fontWeight: "600",
                    }}
                  >
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
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            Set your category budgets
          </Text>

          <Text style={{ color: "#666" }}>
            Decide how much you want to spend in each category this month.
          </Text>

          {selectedCategories.length === 0 ? (
            <Text
              style={{
                color: "#d00",
              }}
            >
              You haven't selected any categories. Go back and select at least
              one.
            </Text>
          ) : (
            selectedCategories.map((category) => (
              <View
                key={category}
                style={{
                  gap: 8,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {category}
                </Text>

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
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
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
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
              }}
            >
              Review your budget
            </Text>

            <Text
              style={{
                marginTop: 6,
                color: "#666",
              }}
            >
              Here's how your money is planned for this month.
            </Text>
          </View>

          {/* Income */}

          <View
            style={{
              padding: 18,
              borderRadius: 14,
              backgroundColor: "#f5f5f5",
            }}
          >
            <Text style={{ color: "#666" }}>Monthly Income</Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: "700",
              }}
            >
              ₦{income.toLocaleString()}
            </Text>
          </View>

          {/* Categories */}

          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Your Budget
            </Text>

            {selectedCategories.map((category) => {
              const amount = Number(categoryAmounts[category]) || 0;

              return (
                <View
                  key={category}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                    }}
                  >
                    {category}
                  </Text>

                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    ₦{amount.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Summary */}

          <View
            style={{
              gap: 14,
              padding: 18,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text>Total Budgeted</Text>

              <Text
                style={{
                  fontWeight: "700",
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
              <Text>Remaining</Text>

              <Text
                style={{
                  fontWeight: "700",
                  color: remainingIncome < 0 ? "#d00" : "#111",
                }}
              >
                ₦{remainingIncome.toLocaleString()}
              </Text>
            </View>
          </View>

          {remainingIncome < 0 && (
            <Text
              style={{
                color: "#d00",
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
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            Your budget is ready 🎉
          </Text>

          <Text style={{ color: "#666" }}>
            You're ready to start tracking your spending.
          </Text>
        </View>
      )}

      {/* Navigation */}

      {error && (
        <Text
          style={{
            color: "#d00",
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
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#ddd",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {step < 5 && (
          <Pressable
            onPress={step === 4 ? handleCreateBudget : nextStep}
            disabled={saving}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: "#111",
              alignItems: "center",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                }}
              >
                {step === 4 ? "Create Budget" : "Continue"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
