import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { Transaction } from "../../../types/transaction";

import { useAccountStore } from "../../../store/account/accountStore";
import { useAuthStore } from "../../../store/auth/authStore";
import { useBudgetStore } from "../../../store/budget/budgetStore";

import { getAccount } from "../../accounts/services/accountService";

import { getTransactions } from "../../transactions/services/transactionService";

import { getProfile } from "../../onboarding/services/profileService";

import { calculateDashboardSummary } from "../services/dashboardService";

import {
  getBudget,
  getBudgetCategories,
  getAllBudgets,
} from "../../budget/services/budgetService";

import { calculateBudgetCategorySummaries } from "../../budget/services/budgetCalculationService";

import { getNotifications } from "../../notifications/services/notificationService";

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
  const clearCurrentAccount = useAccountStore((state) => state.clearCurrentAccount);
  const user = useAuthStore((state) => state.user);
  const selectedBudgetId = useBudgetStore((state) => state.selectedBudgetId);
  const currencyCode = useAccountCurrency();

  const [accountName, setAccountName] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [monthlySummary, setMonthlySummary] = useState<{
    income: number;
    expenses: number;
    netSavings: number;
  }>({ income: 0, expenses: 0, netSavings: 0 });

  const [budgetHealth, setBudgetHealth] = useState<{
    totalBudget: number;
    totalSpent: number;
    percentage: number;
    status: "healthy" | "warning" | "exceeded";
    budgetName: string;
  } | null>(null);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

          // If the account doesn't exist (e.g., after database reset), clear selection
          if (!account) {
            console.log("ACCOUNT NOT FOUND - CLEARING SELECTION");
            clearCurrentAccount();
            setAccountName("");
            setTransactions([]);
            setLoading(false);
            return;
          }

          setAccountName(account.name);

          const data = await getTransactions(currentAccountId);

          setTransactions(data);

          const month = new Date().toISOString().slice(0, 7);

          console.log('[Dashboard] Loading budget - selectedBudgetId:', selectedBudgetId ? selectedBudgetId.slice(0, 8) : 'none');

          // Use the selected budget from the store if available
          let budgetData = null;
          
          if (selectedBudgetId) {
            // Try to get the specific selected budget
            const allBudgets = await getAllBudgets(currentAccountId);
            budgetData = allBudgets.find(b => b.id === selectedBudgetId) || null;
            console.log('[Dashboard] Found selected budget:', budgetData ? budgetData.name : 'not found');
          }
          
          // Fallback: if no budget selected or selected budget not found, use the most recent one
          if (!budgetData) {
            const allBudgets = await getAllBudgets(currentAccountId);
            budgetData = allBudgets.length > 0 ? allBudgets[0] : null;
            console.log('[Dashboard] Using fallback budget:', budgetData ? budgetData.name : 'none available');
          }

          if (budgetData) {
            console.log('[Dashboard] Displaying budget:', { 
              id: budgetData.id.slice(0, 8), 
              name: budgetData.name, 
              month: budgetData.month,
              totalBudget: budgetData.totalBudget 
            });

            const budgetCategories = await getBudgetCategories(budgetData.id);

            console.log('[Dashboard] Budget categories:', budgetCategories.length);

            const transactions = await getTransactions(currentAccountId);

            console.log('[Dashboard] Transactions for calculation:', transactions.length);

            const summaries = calculateBudgetCategorySummaries(
              budgetCategories,
              transactions,
              budgetData.month, // Use the budget's actual month identifier
            );

            console.log('[Dashboard] Calculated summaries:', summaries.length);

            const totalSpent = summaries.reduce(
              (total, category) => total + category.spent,
              0,
            );

            console.log('[Dashboard] Total spent:', totalSpent, 'of', budgetData.totalBudget);

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
              budgetName: budgetData.name,
            });
          } else {
            console.log('[Dashboard] No budget found for account');
            setBudgetHealth(null);
          }

          const transactions = await getTransactions(currentAccountId);

          const recent = [...transactions]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5);

          setRecentTransactions(recent);

          // Calculate monthly financial summary
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          
          const monthlyIncome = transactions
            .filter((t) => t.type === "income" && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
          
          const monthlyExpenses = transactions
            .filter((t) => t.type === "expense" && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
          
          setMonthlySummary({
            income: monthlyIncome,
            expenses: monthlyExpenses,
            netSavings: monthlyIncome - monthlyExpenses,
          });

          // Get unread notification count
          const notifications = await getNotifications(currentAccountId);
          const unreadCount = notifications.filter(n => !n.isRead).length;
          setUnreadNotificationCount(unreadCount);
        } catch (error) {
          console.error("FAILED TO LOAD DASHBOARD:", error);
        } finally {
          setLoading(false);
        }
      }

      loadDashboard();
    }, [currentAccountId, selectedBudgetId]),
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
      <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
        {/* Minimal Header */}
        <View
          style={{
            paddingTop: 60,
            paddingBottom: 16,
            paddingHorizontal: 20,
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
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-outline" size={24} color="#1a1a1a" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/notifications")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
            {unreadNotificationCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: "#ef4444",
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Centered Empty State Content */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            paddingBottom: 80,
          }}
        >
          {/* Illustration with decorative elements */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {/* Left decorative element */}
            <View
              style={{
                position: "absolute",
                left: -60,
                top: 30,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 60,
                  backgroundColor: "#E8E5E0",
                  borderRadius: 20,
                }}
              />
            </View>

            {/* Right decorative element */}
            <View
              style={{
                position: "absolute",
                right: -60,
                top: 30,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 60,
                  backgroundColor: "#E8E5E0",
                  borderRadius: 20,
                }}
              />
            </View>

            {/* Main wallet illustration - ghost style with Dai colors */}
            <View
              style={{
                width: 140,
                height: 140,
                backgroundColor: colors.secondary,
                borderRadius: 70,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Eyes */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 24,
                  marginTop: 20,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 24,
                    backgroundColor: "#888888",
                    borderRadius: 8,
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 24,
                    backgroundColor: "#888888",
                    borderRadius: 8,
                  }}
                />
              </View>

              {/* Mouth */}
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "#888888",
                  borderRadius: 5,
                  marginTop: 16,
                }}
              />

              {/* Wave bottom */}
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 20,
                    backgroundColor: colors.secondary,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 28,
                    height: 20,
                    backgroundColor: colors.secondary,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 28,
                    height: 20,
                    backgroundColor: colors.secondary,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 28,
                    height: 20,
                    backgroundColor: colors.secondary,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Text Content */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 12,
              letterSpacing: -0.3,
            }}
          >
            There's nothing here
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#999999",
              textAlign: "center",
              lineHeight: 22,
              maxWidth: 280,
            }}
          >
            You have not added any account yet. In the future, all your financial data will be displayed here.
          </Text>

          {/* CTA Button */}
          <Pressable
            onPress={async () => {
              const profile = await getProfile();
              if (profile) {
                router.push({
                  pathname: "/create-account",
                  params: { profileId: profile.id },
                });
              }
            }}
            style={{
              marginTop: 48,
              backgroundColor: colors.secondary,
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderRadius: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontWeight: "700",
                fontSize: 16,
                letterSpacing: 0.3,
              }}
            >
              Create Account
            </Text>
          </Pressable>
        </View>
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
      {/* Hero Card - Monthly Financial Summary */}
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
              overflow: "hidden",
            }}
          >
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
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
            {unreadNotificationCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: "#ef4444",
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Monthly Summary */}
        <View style={{ alignItems: "center", marginTop: 28, marginBottom: 24 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            This Month
          </Text>
          <Text
            style={{
              marginTop: 10,
              color: "#fff",
              fontSize: 34,
              fontWeight: "700",
              letterSpacing: -0.5,
            }}
          >
            {monthlySummary.netSavings < 0 ? "-" : ""}
            {formatCurrency(Math.abs(monthlySummary.netSavings), currencyCode)}
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: monthlySummary.netSavings < 0 
                ? "#ef4444" 
                : monthlySummary.expenses >= monthlySummary.income * 0.75
                ? "#e6a700"
                : "#4ade80",
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            {monthlySummary.netSavings >= 0 
              ? monthlySummary.expenses >= monthlySummary.income * 0.75
                ? "Almost exceeding Income"
                : "Net Savings"
              : "Net Deficit"
            } · {accountName}
          </Text>
        </View>

        {/* Quick Stats - Income and Expenses */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 16,
            
            // backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: "500",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Income
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {formatCurrency(monthlySummary.income, currencyCode)}
            </Text>
          </View>
          
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          />
          
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                fontSize: 12,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              Expenses
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {formatCurrency(monthlySummary.expenses, currencyCode)}
            </Text>
          </View>
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

      {/* Income / Expenses Summary */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            padding: 18,
            borderRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 20,
                backgroundColor: "rgba(26,156,75,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-down" size={18} color="#1a9c4b" />
            </View>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>
              Income
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: SECONDARY }}>
            {formatCurrency(summary.income, currencyCode)}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            padding: 18,
            borderRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 20,
                backgroundColor: "rgba(231,76,60,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-up" size={18} color="#e74c3c" />
            </View>
            <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>
              Expenses
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: SECONDARY }}>
            {formatCurrency(summary.expenses, currencyCode)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View>
        {/* Section Header */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1c1c1ea6",
            marginBottom: 24, marginLeft: 12, marginTop: 3,
            letterSpacing: -0.3,
          }}
        >
          Quick Actions
        </Text>
        
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {[
            {
              label: "Accounts",
              icon: "wallet" as const,
              color: colors.secondary, // Faint shade of #120E01
              iconColor: colors.primary,
              route: "/(tabs)/accounts" as const,
            },
            {
              label: "Activity",
              icon: "list" as const,
              color: colors.secondary, // Faint shade of #120E01
              iconColor: colors.primary,
              route: "/(tabs)/activity" as const,
            },
            {
              label: "Budget",
              icon: "pie-chart" as const,
              color: colors.secondary, // Faint shade of #120E01
              iconColor: colors.primary,
              route: "/(tabs)/budget" as const,
            },
            {
              label: "Goals",
              icon: "flag" as const,
              color: colors.secondary, // Faint shade of #120E01
              iconColor: colors.primary,
              route: "/savings-goals" as const,
            },
            {
              label: "AI Coach",
              icon: "sparkles" as const,
              color: colors.secondary, // Faint shade of #120E01
              iconColor: colors.primary,
              route: "/coach" as const,
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

      {/* Monthly Budget Card */}
      {budgetHealth && (
        <Pressable
          onPress={() => router.push("/(tabs)/budget")}
          style={{
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={['#B8F34A', '#9DD635']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 20,
              paddingTop: 30,
              paddingBottom: 35,
              paddingRight: 140,
              position: "relative",
              minHeight: 160,
            }}
          >
            {/* Header with title and status badge */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111111",
                }}
              >
                {budgetHealth.budgetName}
              </Text>

              <View
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                right: -120,

                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: budgetHealth.status === "healthy" ? "#087300" : budgetHealth.status === "warning" ? "#e6a700" : "#d00",
                  }}
                >
                  {budgetHealth.status === "healthy"
                    ? "On Track"
                    : budgetHealth.status === "warning"
                      ? "Warning"
                      : "Exceeded"}
                </Text>
              </View>
            </View>

            {/* Amount spent - 16px semibold as requested */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "400",
                color: "rgba(17, 17, 17, 0.85)",
                marginBottom: 12,
              }}
            >
              {formatCurrency(budgetHealth.totalSpent, currencyCode)} spent of{" "}
              {formatCurrency(budgetHealth.totalBudget, currencyCode)}
            </Text>

            {/* Progress bar - 14px height with dark gradient fill */}
            <View
              style={{
                height: 14,
                backgroundColor: "rgba(17, 17, 17, 0.15)",
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <LinearGradient
                colors={['rgba(17, 17, 17, 0.9)', 'rgba(17, 17, 17, 0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: `${Math.min(budgetHealth.percentage, 100)}%`,
                  height: "100%",
                  borderRadius: 20,
                }}
              />
            </View>

            {/* Percentage text - smaller, lighter */}
            <Text
              style={{
                fontSize: 13,
                color: "rgba(17, 17, 17, 0.75)",
                marginBottom: 20,
              }}
            >
              {budgetHealth.percentage.toFixed(0)}% of your monthly budget
            </Text>

            {/* View Budget link */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#111111",
                }}
              >
                View Budget
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#111111" />
            </View>

            {/* Stacked coins illustration - flipped and positioned */}
            <Image
              source={require("../../../../assets/Personal finance savings concept with stacked coins.png")}
              style={{
                position: "absolute",
                right: -90,
                bottom: -55,
                width: 240,
                height: 240,
                resizeMode: "contain",
                transform: [{ scaleX: -1 }],
              }}
            />
          </LinearGradient>
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
              backgroundColor: colors.secondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="flag" size={20} color={PRIMARY} />
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
                      color: isExpense ? "#e74c3c" : "#1a9c4b",
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
