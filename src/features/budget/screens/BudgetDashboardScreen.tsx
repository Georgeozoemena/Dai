import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { useBudgetStore } from "../../../store/budget/budgetStore";

import { getAllBudgets, getBudgetCategories, deleteBudget } from "../services/budgetService";

import { getTransactions } from "../../transactions/services/transactionService";

import {
  calculateBudgetCategorySummaries,
  type BudgetCategorySummary,
} from "../services/budgetCalculationService";
import { colors, screenStyles } from "../../../theme";
import { checkBudgetHealth } from "../../notifications/services/notificationTriggerService";

export function BudgetDashboardScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const selectedBudgetId = useBudgetStore((state) => state.selectedBudgetId);
  const setSelectedBudgetId = useBudgetStore((state) => state.setSelectedBudget);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  const [categorySummaries, setCategorySummaries] = useState<
    BudgetCategorySummary[]
  >([]);

  const [loading, setLoading] = useState(true);
  
  const [deleting, setDeleting] = useState(false);

  const loadBudgets = useCallback(async () => {
    if (!currentAccountId) {
      setBudgets([]);
      setSelectedBudget(null);
      setCategorySummaries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      console.log('[BudgetDashboard] Loading budgets for account:', currentAccountId);

      const allBudgets = await getAllBudgets(currentAccountId);
      
      console.log('[BudgetDashboard] Loaded budgets:', allBudgets.length);
      
      // Ensure all budgets have required fields with defaults
      const normalizedBudgets = allBudgets.map(budget => ({
        ...budget,
        name: budget.name || 'My Budget',
        period: budget.period || 'monthly' as const,
      }));
      
      console.log('[BudgetDashboard] Normalized budgets:', normalizedBudgets.map(b => ({ 
        id: b.id.slice(0, 8), 
        name: b.name, 
        period: b.period, 
        month: b.month 
      })));
      
      setBudgets(normalizedBudgets);

      // Try to select the previously selected budget, or default to first
      let budgetToShow = normalizedBudgets.find(b => b.id === selectedBudgetId);
      
      if (!budgetToShow && normalizedBudgets.length > 0) {
        budgetToShow = normalizedBudgets[0];
      }
      
      console.log('[BudgetDashboard] Selected budget:', budgetToShow ? {
        id: budgetToShow.id.slice(0, 8),
        name: budgetToShow.name,
        period: budgetToShow.period,
        month: budgetToShow.month
      } : 'none');
      
      setSelectedBudget(budgetToShow || null);
      
      // Save the selected budget to store
      if (budgetToShow) {
        await setSelectedBudgetId(budgetToShow.id);
      }

      if (!budgetToShow) {
        setCategorySummaries([]);
        return;
      }

      const categoryData = await getBudgetCategories(budgetToShow.id);
      
      console.log('[BudgetDashboard] Budget categories:', categoryData.map(c => ({ 
        category: c.category, 
        amount: c.amount 
      })));

      const transactions = await getTransactions(currentAccountId);
      
      console.log('[BudgetDashboard] Total transactions:', transactions.length);
      console.log('[BudgetDashboard] Calculating summaries for period:', budgetToShow.month);

      const summaries = calculateBudgetCategorySummaries(
        categoryData,
        transactions,
        budgetToShow.month,
      );

      console.log('[BudgetDashboard] Summaries calculated:', summaries.length);

      setCategories(categoryData);
      setCategorySummaries(summaries);
    } catch (error) {
      console.error("FAILED TO LOAD BUDGETS:", error);
    } finally {
      setLoading(false);
    }
  }, [currentAccountId, selectedBudgetId, setSelectedBudgetId]);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [loadBudgets]),
  );

  const handleSelectBudget = async (budget: Budget) => {
    setSelectedBudget(budget);
    
    // Save to store so dashboard can use it
    await setSelectedBudgetId(budget.id);
    
    try {
      const categoryData = await getBudgetCategories(budget.id);
      const transactions = await getTransactions(currentAccountId!);
      const summaries = calculateBudgetCategorySummaries(
        categoryData,
        transactions,
        budget.month,
      );

      setCategories(categoryData);
      setCategorySummaries(summaries);
    } catch (error) {
      console.error("FAILED TO LOAD BUDGET DETAILS:", error);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === "web") {
          const confirmed = window.confirm(
            "Delete this budget?\n\nThis will permanently delete this budget and all its categories. This action cannot be undone."
          );
          resolve(confirmed);
        } else {
          Alert.alert(
            "Delete Budget?",
            "This will permanently delete this budget and all its categories. This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { 
                text: "Delete", 
                style: "destructive", 
                onPress: () => resolve(true) 
              },
            ]
          );
        }
      });
    };

    const confirmed = await confirmDelete();
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteBudget(selectedBudget.id);
      
      // Refresh the screen
      await loadBudgets();
      
      if (Platform.OS !== "web") {
        Alert.alert("Success", "Budget deleted successfully");
      }
    } catch (error) {
      console.error("FAILED TO DELETE BUDGET:", error);
      
      if (Platform.OS === "web") {
        window.alert("Failed to delete budget. Please try again.");
      } else {
        Alert.alert("Error", "Failed to delete budget. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

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
            You have not selected any account yet. Select an account to view your budgets.
          </Text>
        </View>
      </View>
    );
  }

  if (budgets.length === 0) {
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
            No budgets yet
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
            You have not created any budgets yet. Create your first budget to start tracking your spending.
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

  if (!selectedBudget) {
    return null;
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
    selectedBudget && selectedBudget.totalBudget > 0
      ? (totalSpent / selectedBudget.totalBudget) * 100
      : 0;

  // Check budget health and trigger notifications if needed
  if (currentAccountId && selectedBudget) {
    checkBudgetHealth({
      accountId: currentAccountId,
      budgetId: selectedBudget.id,
      budgetName: selectedBudget.name,
      totalSpent,
      totalBudget: selectedBudget.totalBudget,
    }).catch((error) => {
      console.error("Failed to check budget health:", error);
    });
  }

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
      {/* Header with Actions */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={screenStyles.title}>Budgets</Text>
          <Text style={screenStyles.subtitle}>Manage your spending plans</Text>
        </View>
        
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/budget-report")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.secondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
          </Pressable>
          
          <Pressable
            onPress={() => router.push("/budget/create")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.secondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
          
          <Pressable
            onPress={handleDeleteBudget}
            disabled={deleting}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Budget Selector */}
      {budgets.length > 1 && (
        <View style={{ marginBottom: 20 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {budgets.map((budget) => (
              <Pressable
                key={budget.id}
                onPress={() => handleSelectBudget(budget)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: selectedBudget?.id === budget.id ? colors.secondary : colors.borderInput,
                  backgroundColor: selectedBudget?.id === budget.id ? `${colors.secondary}10` : colors.surface,
                }}
              >
                <Text style={{ 
                  fontWeight: selectedBudget?.id === budget.id ? '600' : '400',
                  color: selectedBudget?.id === budget.id ? colors.secondary : colors.text,
                  fontSize: 14,
                }}>
                  {budget.name}
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: colors.textSecondary,
                  marginTop: 2,
                }}>
                  {budget.period ? budget.period.charAt(0).toUpperCase() + budget.period.slice(1) : 'Monthly'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Overall Health Card */}
      <View style={styles.healthCard}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#B8F34A', '#9DD635']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.healthCardGradient}
        />
        
        {/* Content */}
        <View style={styles.healthCardContent}>
          {/* Header with Status Badge */}
          <View style={styles.healthCardHeader}>
            <Text style={styles.healthCardTitle}>{selectedBudget.name}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: colors.secondary }
            ]}>
              <Text style={[styles.statusBadgeText, { 
                color: colors.primary
              }]}>
                {overallStatus === "healthy" ? "On Track" : 
                 overallStatus === "warning" ? "Watch Out" : "Over Budget"}
              </Text>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>
              ₦{totalSpent.toLocaleString()} spent of ₦{selectedBudget.totalBudget.toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={['rgba(17, 17, 17, 0.9)', 'rgba(17, 17, 17, 0.6)']}
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
        <Text style={{ color: colors.textMuted }}>Total Budget</Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 28,
            fontWeight: "700",
            color: colors.secondary,
          }}
        >
          ₦{selectedBudget.totalBudget.toLocaleString()}
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: colors.textMuted,
          }}
        >
          {selectedBudget.period ? (selectedBudget.period.charAt(0).toUpperCase() + selectedBudget.period.slice(1)) : 'Monthly'} income: ₦{selectedBudget.totalIncome.toLocaleString()}
        </Text>
      </View>

      {/* Categories */}
      <View style={{ gap: 12 }}>
        <Text style={styles.categoriesTitle}>Your Categories</Text>

        {categorySummaries.map((summary) => {
          const statusColor = 
            summary.percentage >= 100 ? colors.error :
            summary.percentage >= 75 ? colors.warning :
            colors.success;

          return (
            <View
              key={summary.categoryId}
              style={styles.categoryCard}
            >
              {/* Compact Header with all info in one row */}
              <View style={styles.categoryHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryName}>
                    {summary.category}
                  </Text>
                  <Text style={styles.categorySubtext}>
                    ₦{summary.spent.toLocaleString()} / ₦{summary.budgeted.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.categoryRightSection}>
                  <View style={[styles.percentageBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.percentageBadgeText, { color: statusColor }]}>
                      {summary.percentage.toFixed(0)}%
                    </Text>
                  </View>
                  <Text style={styles.remainingText}>
                    ₦{Math.abs(summary.remaining).toLocaleString()} left
                  </Text>
                </View>
              </View>

              {/* Slim Progress Bar */}
              <View style={styles.categoryProgressTrack}>
                <View
                  style={[styles.categoryProgressFill, {
                    width: `${Math.min(summary.percentage, 100)}%`,
                    backgroundColor: statusColor,
                  }]}
                />
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
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.2,
    // shadowRadius: 16,
    // elevation: 8,
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
    color: "#111111",
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
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
    color: "rgba(17, 17, 17, 0.85)",
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: "rgba(17, 17, 17, 0.15)",
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
    color: "rgba(17, 17, 17, 0.75)",
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
    color: "#111111",
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  categoryRightSection: {
    alignItems: "flex-end",
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  percentageBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  categoryProgressTrack: {
    height: 8,
    backgroundColor: colors.borderInput,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
