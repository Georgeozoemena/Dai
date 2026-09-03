import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Budget, BudgetCategory } from "../types/budget";

import { useAccountStore } from "../../../store/account/accountStore";

import { getBudget, getBudgetCategories } from "../services/budgetService";

import { getTransactions } from "../../transactions/services/transactionService";

import {
  calculateBudgetCategorySummaries,
  type BudgetCategorySummary,
} from "../services/budgetCalculationService";
import { colors, screenStyles } from "../../../theme";

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
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading budget...
        </Text>
      </View>
    );
  }

  if (!currentAccountId) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.title}>No account selected</Text>

        <Text style={[screenStyles.subtitle, { textAlign: "center" }]}>
          Select an account to view your budget.
        </Text>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={screenStyles.centered}>
        <Ionicons
          name="calculator-outline"
          size={64}
          color={colors.textMuted}
          style={{ marginBottom: 16 }}
        />

        <Text style={screenStyles.title}>No budget yet</Text>

        <Text style={[screenStyles.subtitle, { textAlign: "center" }]}>
          Create a monthly budget to start tracking your spending.
        </Text>

        <Pressable
          onPress={() => router.push("/budget/create")}
          style={[screenStyles.primaryButton, { marginTop: 24, paddingHorizontal: 20 }]}
        >
          <Text style={screenStyles.primaryButtonText}>Create Budget</Text>
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
      ? colors.error
      : overallStatus === "warning"
        ? colors.warning
        : colors.success;

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Budget</Text>

        <Text style={screenStyles.subtitle}>Your plan for this month.</Text>
      </View>

      {/* Overall Health Card */}

      <View style={[screenStyles.card, { gap: 14 }]}>
        <View>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
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
            <Text style={{ color: colors.textSecondary }}>Total Spent</Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
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
            <Text style={{ color: colors.textSecondary }}>Remaining</Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 18,
                fontWeight: "700",
                color: totalRemaining < 0 ? colors.error : colors.text,
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
            backgroundColor: colors.border,
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
            color: colors.textSecondary,
          }}
        >
          {overallPercentage.toFixed(0)}% of your monthly budget has been used.
        </Text>
      </View>

      {/* Summary */}

      <View style={screenStyles.card}>
        <Text style={{ color: colors.textSecondary }}>Total Budget</Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 28,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          ₦{budget.totalBudget.toLocaleString()}
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: colors.textSecondary,
          }}
        >
          Monthly income: ₦{budget.totalIncome.toLocaleString()}
        </Text>
      </View>

      {/* Categories */}

      <View style={{ gap: 12 }}>
        <Text style={screenStyles.sectionTitle}>Your Categories</Text>

        {categorySummaries.map((summary) => {
          const statusColor =
            summary.status === "exceeded"
              ? colors.error
              : summary.status === "warning"
                ? colors.warning
                : colors.success;

          return (
            <View
              key={summary.categoryId}
              style={[screenStyles.card, { gap: 12 }]}
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
                    color: colors.text,
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

              <Text style={{ color: colors.textSecondary }}>
                Budget: ₦{summary.budgeted.toLocaleString()}
              </Text>

              <Text
                style={{
                  color: summary.remaining < 0 ? colors.error : colors.textSecondary,
                }}
              >
                Remaining: ₦{summary.remaining.toLocaleString()}
              </Text>

              <View
                style={{
                  height: 8,
                  backgroundColor: colors.border,
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
