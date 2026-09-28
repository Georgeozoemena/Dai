import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
      <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            paddingBottom: 80,
          }}
        >
          {/* Sad Wallet Ghost Illustration */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {/* Decorative elements */}
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

            {/* Purple/Blue wallet ghost */}
            <View
              style={{
                width: 140,
                height: 140,
                backgroundColor: "#8B7FD6",
                borderRadius: 70,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Sad eyes */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 24,
                  marginTop: 15,
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 20,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 7,
                  }}
                />
                <View
                  style={{
                    width: 14,
                    height: 20,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 7,
                  }}
                />
              </View>

              {/* Sad mouth (upside down) */}
              <View
                style={{
                  width: 30,
                  height: 15,
                  borderTopLeftRadius: 15,
                  borderTopRightRadius: 15,
                  borderWidth: 3,
                  borderBottomWidth: 0,
                  borderColor: "#1a1a1a",
                  marginTop: 18,
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
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 28,
                      height: 20,
                      backgroundColor: "#8B7FD6",
                      borderBottomLeftRadius: 20,
                      borderBottomRightRadius: 20,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>

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
            No account selected
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
            You have not selected any account yet. Select an account to view your budget.
          </Text>
        </View>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            paddingBottom: 80,
          }}
        >
          {/* Calculator Ghost Illustration */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {/* Decorative elements */}
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

            {/* Green calculator ghost */}
            <View
              style={{
                width: 140,
                height: 140,
                backgroundColor: "#6FCF97",
                borderRadius: 70,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Happy eyes */}
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
                    height: 16,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 8,
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 8,
                  }}
                />
              </View>

              {/* Happy smile */}
              <View
                style={{
                  width: 30,
                  height: 15,
                  borderBottomLeftRadius: 15,
                  borderBottomRightRadius: 15,
                  borderWidth: 3,
                  borderTopWidth: 0,
                  borderColor: "#1a1a1a",
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
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 28,
                      height: 20,
                      backgroundColor: "#6FCF97",
                      borderBottomLeftRadius: 20,
                      borderBottomRightRadius: 20,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>

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
            No budget yet
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#999999",
              textAlign: "center",
              lineHeight: 22,
              maxWidth: 280,
              marginBottom: 48,
            }}
          >
            You have not created any budget yet. Create a monthly budget to start tracking your spending.
          </Text>

          {/* CTA Button */}
          <Pressable
            onPress={() => router.push("/budget/create")}
            style={{
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
              Create Budget
            </Text>
          </Pressable>
        </View>
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
      <View style={styles.healthCard}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#EA580C', '#DC2626']} // Orange to Red gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.healthCardGradient}
        />
        
        {/* Content */}
        <View style={styles.healthCardContent}>
          {/* Header with Status Badge */}
          <View style={styles.healthCardHeader}>
            <Text style={styles.healthCardTitle}>Monthly Budget</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: overallStatus === "healthy" ? "#FFFFFF" : "rgba(255,255,255,0.9)" }
            ]}>
              <Text style={[styles.statusBadgeText, { 
                color: overallStatus === "exceeded" ? colors.error : 
                       overallStatus === "warning" ? "#D97706" : "#059669" 
              }]}>
                {overallStatus === "healthy" ? "On Track" : 
                 overallStatus === "warning" ? "Watch Out" : "Over Budget"}
              </Text>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>
              ₦{totalSpent.toLocaleString()} spent of ₦{budget.totalBudget.toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)']} // White gradient blend
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, {
                width: `${Math.min(overallPercentage, 100)}%`,
              }]}
            />
          </View>

          {/* Percentage Text */}
          <Text style={styles.percentageText}>
            {overallPercentage.toFixed(0)}% of your monthly budget
          </Text>
        </View>

        {/* Decorative Coin Stack Illustration */}
        <View style={styles.coinStack}>
          <View style={[styles.coin, { bottom: 0, opacity: 0.85 }]} />
          <View style={[styles.coin, { bottom: 10, opacity: 0.9 }]} />
          <View style={[styles.coin, { bottom: 20, opacity: 0.95 }]} />
          <View style={[styles.coin, { bottom: 30, opacity: 1 }]} />
        </View>
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

      <View style={{ gap: 16 }}>
        <Text style={styles.categoriesTitle}>Your Categories</Text>

        {categorySummaries.map((summary) => {
          return (
            <View
              key={summary.categoryId}
              style={styles.categoryCard}
            >
              {/* Header Row */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Text style={styles.categoryName}>
                    {summary.category}
                  </Text>
                  <Text style={styles.categoryBudgetText}>
                    Budget: ₦{summary.budgeted.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Percentage Display */}
              <Text style={styles.percentageDisplay}>
                {summary.percentage.toFixed(0)}%
              </Text>

              {/* Progress Bar with Gradient Fill */}
              <View style={styles.categoryProgressWrapper}>
                <View style={styles.categoryProgressTrack}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)']} // White gradient blend
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.categoryProgressGradient, {
                      width: `${Math.min(summary.percentage, 100)}%`,
                    }]}
                  />
                </View>
                
                {/* Due/Remaining Info */}
                <View style={styles.remainingBadge}>
                  <Text style={styles.remainingBadgeText}>
                    ₦{Math.abs(summary.remaining).toLocaleString()} left
                  </Text>
                </View>
              </View>

              {/* Footer Info */}
              <View style={styles.categoryFooter}>
                <View style={styles.spentInfo}>
                  <Text style={styles.spentLabel}>Spent</Text>
                  <Text style={styles.spentAmount}>
                    ₦{summary.spent.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  healthCard: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 230,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  healthCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  healthCardContent: {
    padding: 22,
    position: "relative",
    zIndex: 1,
  },
  healthCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  healthCardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  amountSection: {
    marginTop: 24,
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 18,
  },
  viewBudgetLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewBudgetLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  coinStack: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 90,
    height: 90,
  },
  coin: {
    position: "absolute",
    right: 0,
    width: 70,
    height: 22,
    backgroundColor: "#FBBF24",
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: "#FDE68A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  categoryCard: {
    backgroundColor: colors.secondary, // Dark background
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitleRow: {
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  categoryBudgetText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
  },
  percentageDisplay: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: -1,
  },
  categoryProgressWrapper: {
    marginBottom: 16,
  },
  categoryProgressTrack: {
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  categoryProgressGradient: {
    height: "100%",
    borderRadius: 20,
  },
  remainingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  remainingBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spentInfo: {
    flex: 1,
  },
  spentLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 2,
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
});
