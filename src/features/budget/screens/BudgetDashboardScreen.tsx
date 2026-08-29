import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import type { Budget, BudgetCategory } from "../types/budget";

import { useAccountStore } from "../../../store/account/accountStore";

import { getBudget, getBudgetCategories } from "../services/budgetService";

import { getTransactions } from "../../transactions/services/transactionService";

import {
  calculateBudgetCategorySummaries,
  type BudgetCategorySummary,
} from "../services/budgetCalculationService";

export function BudgetDashboardScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  const [budget, setBudget] = useState<Budget | null>(null);

  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  const [categorySummaries, setCategorySummaries] = useState<
    BudgetCategorySummary[]
  >([]);

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadBudget() {
        if (!currentAccountId) {
          setBudget(null);
          setCategorySummaries([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const month = new Date().toISOString().slice(0, 7);

          const budgetData = await getBudget(currentAccountId, month);

          if (!budgetData) {
            setBudget(null);
            setCategorySummaries([]);
            return;
          }

          const categoryData = await getBudgetCategories(budgetData.id);

          const transactions = await getTransactions(currentAccountId);

          const summaries = calculateBudgetCategorySummaries(
            categoryData,
            transactions,
            month,
          );

          setBudget(budgetData);
          setCategorySummaries(summaries);
        } catch (error) {
          console.error("FAILED TO LOAD BUDGET:", error);
        } finally {
          setLoading(false);
        }
      }

      loadBudget();
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

        <Text style={{ marginTop: 12 }}>Loading budget...</Text>
      </View>
    );
  }

  if (!currentAccountId) {
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
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          No account selected
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#666",
            textAlign: "center",
          }}
        >
          Select an account to view your budget.
        </Text>
      </View>
    );
  }

  if (!budget) {
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
            fontSize: 22,
            fontWeight: "700",
          }}
        >
          No budget yet
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#666",
            textAlign: "center",
          }}
        >
          Create a monthly budget to start tracking your spending.
        </Text>

        <Pressable
          onPress={() => router.push("/budget/create")}
          style={{
            marginTop: 24,
            backgroundColor: "#111",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Create Budget
          </Text>
        </Pressable>
      </View>
    );
  }

  const totalSpent = categorySummaries.reduce(
    (total, category) => total + category.spent,
    0,
  );

  const totalRemaining = categorySummaries.reduce(
    (total, category) => total + category.remaining,
    0,
  );

  const overallPercentage =
    budget && budget.totalBudget > 0
      ? (totalSpent / budget.totalBudget) * 100
      : 0;

  const overallStatus =
    overallPercentage >= 100
      ? "exceeded"
      : overallPercentage >= 75
        ? "warning"
        : "healthy";

  const overallStatusColor =
    overallStatus === "exceeded"
      ? "#d00"
      : overallStatus === "warning"
        ? "#e6a700"
        : "#1a9c4b";

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
          Budget
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          Your plan for this month.
        </Text>
      </View>

      {/* Overall Health Card */}

      <View
        style={{
          padding: 20,
          borderRadius: 18,
          borderWidth: 1,
          backgroundColor: "#121212",
          borderColor: overallStatusColor,
          gap: 14,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
            }}
          >
            MONTHLY BUDGET HEALTH
          </Text>

          <Text
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: "700",
              color: overallStatusColor,
            }}
          >
            {overallStatus === "healthy"
              ? "🟢 You're doing well"
              : overallStatus === "warning"
                ? "🟡 Watch your spending"
                : "🔴 Budget exceeded"}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ color: "#666" }}>Total Spent</Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 18,
                fontWeight: "700",
                color: "#fff",
              }}
            >
              ₦{totalSpent.toLocaleString()}
            </Text>
          </View>

          <View
            style={{
              alignItems: "flex-end",
            }}
          >
            <Text style={{ color: "#666" }}>Remaining</Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 18,
                fontWeight: "700",
                color: totalRemaining < 0 ? "#d00" : "#111",
              }}
            >
              ₦{totalRemaining.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Overall Progress */}

        <View
          style={{
            height: 10,
            backgroundColor: "#eee",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.min(overallPercentage, 100)}%`,
              height: "100%",
              backgroundColor: overallStatusColor,
            }}
          />
        </View>

        <Text
          style={{
            color: "#666",
          }}
        >
          {overallPercentage.toFixed(0)}% of your monthly budget has been used.
        </Text>
      </View>

      {/* Summary */}

      <View
        style={{
          padding: 20,
          borderRadius: 16,
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ color: "#666" }}>Total Budget</Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          ₦{budget.totalBudget.toLocaleString()}
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#666",
          }}
        >
          Monthly income: ₦{budget.totalIncome.toLocaleString()}
        </Text>
      </View>

      {/* Categories */}

      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Your Categories
        </Text>

        {categorySummaries.map((summary) => {
          const statusColor =
            summary.status === "exceeded"
              ? "#d00"
              : summary.status === "warning"
                ? "#e6a700"
                : "#1a9c4b";

          return (
            <View
              key={summary.categoryId}
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {summary.category}
                </Text>

                <Text
                  style={{
                    fontWeight: "700",
                    color: statusColor,
                  }}
                >
                  ₦{summary.spent.toLocaleString()}
                </Text>
              </View>

              <Text style={{ color: "#666" }}>
                Budget: ₦{summary.budgeted.toLocaleString()}
              </Text>

              <Text
                style={{
                  color: summary.remaining < 0 ? "#d00" : "#666",
                }}
              >
                Remaining: ₦{summary.remaining.toLocaleString()}
              </Text>

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
                    width: `${Math.min(summary.percentage, 100)}%`,
                    height: "100%",
                    backgroundColor: statusColor,
                  }}
                />
              </View>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: statusColor,
                }}
              >
                {summary.status === "healthy"
                  ? "🟢 You're on track"
                  : summary.status === "warning"
                    ? "🟡 You're getting close to your limit"
                    : "🔴 You've exceeded this budget"}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
