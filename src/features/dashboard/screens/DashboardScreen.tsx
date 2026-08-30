import { useCallback, useState, useEffect } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Transaction } from "../../../types/transaction";

import { useAccountStore } from "../../../store/account/accountStore";

import { getAccount } from "../../accounts/services/accountService";

import { getTransactions } from "../../transactions/services/transactionService";

import { calculateDashboardSummary } from "../services/dashboardService";

import {
  getBudget,
  getBudgetCategories,
} from "../../budget/services/budgetService";

import { calculateBudgetCategorySummaries } from "../../budget/services/budgetCalculationService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

export function DashboardScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [accountName, setAccountName] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [budgetHealth, setBudgetHealth] = useState<{
    totalBudget: number;
    totalSpent: number;
    percentage: number;
    status: "healthy" | "warning" | "exceeded";
  } | null>(null);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  useFocusEffect(
    useCallback(() => {
      async function loadDashboard() {
        if (!currentAccountId) {
          setAccountName("");
          setTransactions([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const account = await getAccount(currentAccountId);

          if (account) {
            setAccountName(account.name);
          }

          const data = await getTransactions(currentAccountId);

          setTransactions(data);

          const month = new Date().toISOString().slice(0, 7);

          const budgetData = await getBudget(currentAccountId, month);

          if (budgetData) {
            const budgetCategories = await getBudgetCategories(budgetData.id);

            const transactions = await getTransactions(currentAccountId);

            const summaries = calculateBudgetCategorySummaries(
              budgetCategories,
              transactions,
              month,
            );

            const totalSpent = summaries.reduce(
              (total, category) => total + category.spent,
              0,
            );

            const percentage =
              budgetData.totalBudget > 0
                ? (totalSpent / budgetData.totalBudget) * 100
                : 0;

            const status =
              percentage >= 100
                ? "exceeded"
                : percentage >= 75
                  ? "warning"
                  : "healthy";

            setBudgetHealth({
              totalBudget: budgetData.totalBudget,
              totalSpent,
              percentage,
              status,
            });
          } else {
            setBudgetHealth(null);
          }

          const transactions = await getTransactions(currentAccountId);

          const recent = [...transactions]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5);

          setRecentTransactions(recent);
        } catch (error) {
          console.error("FAILED TO LOAD DASHBOARD:", error);
        } finally {
          setLoading(false);
        }
      }

      loadDashboard();
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
        <Text style={{ marginTop: 12 }}>Loading dashboard...</Text>
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
        <Pressable
          onPress={() => router.push("/(tabs)/accounts")}
          style={{
            marginTop: 20,
            backgroundColor: "#111",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "600",
            }}
          >
            Select Account
          </Text>
        </Pressable>
      </View>
    );
  }

  const summary = calculateDashboardSummary(transactions);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              color: "#666",
            }}
          >
            Welcome back
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 32,
              fontWeight: "700",
            }}
          >
            {accountName}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/settings")}
          style={{
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Ionicons name="settings-outline" size={24} color="#111" />
        </Pressable>
      </View>

      {/* Account Switcher */}
      <Pressable
        onPress={() => router.push("/(tabs)/accounts")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="wallet-outline" size={24} color="#666" />
          <View>
            <Text
              style={{
                fontSize: 13,
                color: "#666",
              }}
            >
              Current account
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {accountName}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </Pressable>

      {/* Balance */}
      <View
        style={{
          backgroundColor: "#111",
          borderRadius: 18,
          padding: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="cash-outline" size={20} color="#aaa" />
          <Text
            style={{
              color: "#aaa",
            }}
          >
            Balance
          </Text>
        </View>
        <Text
          style={{
            marginTop: 8,
            color: "#fff",
            fontSize: 36,
            fontWeight: "700",
          }}
        >
          {formatCurrency(summary.balance, currencyCode)}
        </Text>
      </View>

      {/* Income / Expenses */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="arrow-down-circle-outline"
              size={16}
              color="#4caf50"
            />
            <Text style={{ color: "#666" }}>Income</Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {formatCurrency(summary.income, currencyCode)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="arrow-up-circle-outline"
              size={16}
              color="#f44336"
            />
            <Text style={{ color: "#666" }}>Expenses</Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {formatCurrency(summary.expenses, currencyCode)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          Quick Actions
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.push("/expense")}
            style={{
              flex: 1,
              backgroundColor: "#111",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="remove-circle-outline" size={20} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Expense
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/income")}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#111" />
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              Income
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Budget Health */}
      <View>
        {budgetHealth && (
          <Pressable
            onPress={() => router.push("/(tabs)/budget")}
            style={{
              padding: 20,
              borderRadius: 18,
              backgroundColor: "#000000",
              gap: 12,
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
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#ffffff"
                }}
                >
                Monthly Budget
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#ffffff"
                }}
              >
                {budgetHealth.status === "healthy"
                  ? "🟢 On track"
                  : budgetHealth.status === "warning"
                    ? "🟡 Be careful"
                    : "🔴 Exceeded"}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#eae7e7",
              }}
            >
              {formatCurrency(budgetHealth.totalSpent, currencyCode)} spent
            </Text>

            <Text style={{ color: "#666" }}>
              of {formatCurrency(budgetHealth.totalBudget, currencyCode)}
            </Text>

            {/* Progress Bar */}

            <View
              style={{
                height: 8,
                backgroundColor: "#ddd",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(budgetHealth.percentage, 100)}%`,
                  height: "100%",
                  backgroundColor:
                    budgetHealth.status === "exceeded"
                      ? "#d00"
                      : budgetHealth.status === "warning"
                        ? "#e6a700"
                        : "#1a9c4b",
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 13,
                color: "#666",
              }}
            >
              {budgetHealth.percentage.toFixed(0)}% of your monthly budget used
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginTop: 4,
              }}
            >
              View Budget →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Savings Goals */}
      <Pressable
        onPress={() => router.push("/savings-goals")}
        style={{
          padding: 20,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#ddd",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="flag-outline" size={24} color="#111" />
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Savings Goals
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#666",
              }}
            >
              Track your progress
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </Pressable>

      {/* Recent Transactions */}
      <View style={{ gap: 14 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Recent Transactions
          </Text>

          <Pressable onPress={() => router.push("/(tabs)/activity")}>
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              See All →
            </Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <Text style={{ color: "#666" }}>No transactions yet.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {recentTransactions.map((transaction) => {
              const isExpense = transaction.type === "expense";

              return (
                <Pressable
                  key={transaction.id}
                  onPress={() => router.push(`/transaction/${transaction.id}`)}
                  style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#eee",
                    borderRadius: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {transaction.category}
                      </Text>

                      <Text
                        style={{
                          marginTop: 4,
                          color: "#666",
                          fontSize: 13,
                        }}
                      >
                        {transaction.description ||
                          new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: isExpense ? "#d00" : "#1a9c4b",
                      }}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(transaction.amount, currencyCode)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
