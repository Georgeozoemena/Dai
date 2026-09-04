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
import { colors, radii, screenStyles } from "../../../theme";

const PRIMARY = colors.primary;
const SECONDARY = colors.secondary;

function formatTransactionTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DashboardScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [accountName, setAccountName] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [balanceVisible, setBalanceVisible] = useState(true);

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
      <View style={[screenStyles.centered, { padding: 24 }]}>
        <ActivityIndicator color={SECONDARY} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  if (!currentAccountId) {
    return (
      <View style={[screenStyles.centered, { padding: 24 }]}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: SECONDARY,
          }}
        >
          No account selected
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/accounts")}
          style={{
            marginTop: 20,
            backgroundColor: SECONDARY,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: PRIMARY,
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
  const accountIdLabel = currentAccountId.slice(0, 8).toUpperCase();

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        gap: 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Balance Card */}
      <View
        style={{
          backgroundColor: SECONDARY,
          borderRadius: 28,
          padding: 22,
          overflow: "hidden",
        }}
      >
        {/* Decorative background arches */}
        <View
          style={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 180,
            height: 180,
            borderRadius: 90,
            borderWidth: 28,
            borderColor: "rgba(255,255,255,0.04)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 32,
            borderColor: "rgba(255,255,255,0.03)",
          }}
        />

        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/notifications")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Balance */}
        <View style={{ alignItems: "center", marginTop: 28, marginBottom: 24 }}>
          <Pressable
            onPress={() => setBalanceVisible((visible) => !visible)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              Total Balance
            </Text>
            <Ionicons
              name={balanceVisible ? "eye-outline" : "eye-off-outline"}
              size={16}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
          <Text
            style={{
              marginTop: 10,
              color: "#fff",
              fontSize: 34,
              fontWeight: "700",
              letterSpacing: -0.5,
            }}
          >
            {balanceVisible
              ? formatCurrency(summary.balance, currencyCode)
              : "••••••••"}
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            {accountName}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/income")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "rgba(255,255,255,0.12)",
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              Income
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/expense")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "rgba(255,255,255,0.12)",
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              Expense
            </Text>
            <Ionicons name="arrow-up-outline" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Income / Expenses summary */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(26,156,75,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-down" size={14} color="#1a9c4b" />
            </View>
            <Text style={{ color: "#888", fontSize: 13 }}>Income</Text>
          </View>
          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "700",
              color: SECONDARY,
            }}
          >
            {formatCurrency(summary.income, currencyCode)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(244,67,54,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-up" size={14} color="#f44336" />
            </View>
            <Text style={{ color: "#888", fontSize: 13 }}>Expenses</Text>
          </View>
          <Text
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "700",
              color: SECONDARY,
            }}
          >
            {formatCurrency(summary.expenses, currencyCode)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {[
            {
              label: "Accounts",
              icon: "wallet-outline" as const,
              color: "#dbeafe",
              iconColor: "#2563eb",
              route: "/(tabs)/accounts" as const,
            },
            {
              label: "Activity",
              icon: "list-outline" as const,
              color: "#ffedd5",
              iconColor: "#ea580c",
              route: "/(tabs)/activity" as const,
            },
            {
              label: "Budget",
              icon: "pie-chart-outline" as const,
              color: "#dcfce7",
              iconColor: "#16a34a",
              route: "/(tabs)/budget" as const,
            },
            {
              label: "Goals",
              icon: "flag-outline" as const,
              color: "#e0e7ff",
              iconColor: "#4f46e5",
              route: "/savings-goals" as const,
            },
          ].map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route)}
              style={{
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: action.color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={action.iconColor}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: SECONDARY,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Budget Health */}
      {budgetHealth && (
        <Pressable
          onPress={() => router.push("/(tabs)/budget")}
          style={{
            padding: 20,
            borderRadius: 20,
            backgroundColor: colors.surface,
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
                fontSize: 17,
                fontWeight: "700",
                color: SECONDARY,
              }}
            >
              Monthly Budget
            </Text>

            <View
              style={{
                backgroundColor:
                  budgetHealth.status === "healthy"
                    ? "rgba(26,156,75,0.12)"
                    : budgetHealth.status === "warning"
                      ? "rgba(251,204,51,0.2)"
                      : "rgba(244,67,54,0.12)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color:
                    budgetHealth.status === "healthy"
                      ? "#1a9c4b"
                      : budgetHealth.status === "warning"
                        ? "#b8860b"
                        : "#d00",
                }}
              >
                {budgetHealth.status === "healthy"
                  ? "On track"
                  : budgetHealth.status === "warning"
                    ? "Be careful"
                    : "Exceeded"}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: SECONDARY,
            }}
          >
            {formatCurrency(budgetHealth.totalSpent, currencyCode)} spent
          </Text>

          <Text style={{ color: "#999", fontSize: 13 }}>
            of {formatCurrency(budgetHealth.totalBudget, currencyCode)}
          </Text>

          <View
            style={{
              height: 6,
              backgroundColor: "#eee",
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
                      ? PRIMARY
                      : "#1a9c4b",
                borderRadius: 10,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 12,
              color: "#999",
            }}
          >
            {budgetHealth.percentage.toFixed(0)}% of your monthly budget used
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: SECONDARY,
            }}
          >
            View Budget →
          </Text>
        </Pressable>
      )}

      {/* Savings Goals */}
      <Pressable
        onPress={() => router.push("/savings-goals")}
        style={{
          padding: 18,
          borderRadius: 20,
          backgroundColor: colors.surface,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(251,204,51,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="flag" size={20} color={SECONDARY} />
          </View>
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: SECONDARY,
              }}
            >
              Savings Goals
            </Text>
            <Text
              style={{
                marginTop: 3,
                fontSize: 13,
                color: "#999",
              }}
            >
              Track your progress
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </Pressable>

      {/* Recent Transactions */}
      <View style={{ gap: 16 }}>
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
              color: SECONDARY,
            }}
          >
            Transactions
          </Text>

          <Pressable onPress={() => router.push("/(tabs)/activity")}>
            <Text
              style={{
                fontWeight: "600",
                fontSize: 14,
                color: SECONDARY,
              }}
            >
              View All
            </Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
              backgroundColor: colors.surface,
              borderRadius: 20,
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={48}
              color={colors.borderInput}
              style={{ marginBottom: 12 }}
            />
            <Text style={{ color: "#999" }}>No transactions yet.</Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingVertical: 8,
            }}
          >
            {recentTransactions.map((transaction, index) => {
              const isExpense = transaction.type === "expense";
              const isLast = index === recentTransactions.length - 1;

              return (
                <Pressable
                  key={transaction.id}
                  onPress={() => router.push(`/transaction/${transaction.id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: "#f3f3f3",
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: SECONDARY,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={
                        isExpense
                          ? "arrow-up-outline"
                          : "arrow-down-outline"
                      }
                      size={20}
                      color="#fff"
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: SECONDARY,
                      }}
                    >
                      {transaction.category}
                    </Text>

                    <Text
                      style={{
                        marginTop: 3,
                        color: "#999",
                        fontSize: 12,
                      }}
                    >
                      {isExpense ? "Expense" : "Income"} •{" "}
                      {formatTransactionTime(transaction.date)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: isExpense ? SECONDARY : "#1a9c4b",
                    }}
                  >
                    {isExpense ? "-" : "+"}
                    {formatCurrency(transaction.amount, currencyCode)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
