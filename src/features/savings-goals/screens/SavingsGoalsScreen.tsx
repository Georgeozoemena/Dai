import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";

import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PageBackButton } from "../../../components/PageBackButton";

import type { SavingsGoal } from "../../../types/savingsGoal";

import { useAccountStore } from "../../../store/account/accountStore";

import { getSavingsGoals, isPaymentDue, isPaymentOverdue, deleteSavingsGoal } from "../services/savingsGoalService";
import { checkAndSendReminders, showPaymentReminderPopup } from "../services/savingsReminderService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";
import { colors, screenStyles } from "../../../theme";

export function SavingsGoalsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadGoals() {
        if (!currentAccountId) {
          setGoals([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const data = await getSavingsGoals(currentAccountId);

          setGoals(data);

          // Check for due/overdue payments and send reminders
          await checkAndSendReminders(data, currentAccountId);

          // Show popup for overdue payments (most urgent)
          const overdueGoal = data.find(goal =>
            goal.currentAmount < goal.targetAmount && isPaymentOverdue(goal)
          );

          if (overdueGoal) {
            showPaymentReminderPopup(overdueGoal);
          } else {
            // If no overdue, show popup for due payments
            const dueGoal = data.find(goal =>
              goal.currentAmount < goal.targetAmount && isPaymentDue(goal)
            );

            if (dueGoal) {
              showPaymentReminderPopup(dueGoal);
            }
          }
        } catch (error) {
          console.error("FAILED TO LOAD SAVINGS GOALS:", error);
        } finally {
          setLoading(false);
        }
      }

      loadGoals();
    }, [currentAccountId]),
  );

  if (loading) {
    return (
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading goals...
        </Text>
      </View>
    );
  }

  if (!currentAccountId) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.sectionTitle}>No account selected</Text>

        <Text
          style={{
            marginTop: 8,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Select an account to manage your savings goals.
        </Text>
      </View>
    );
  }

  // Filter goals based on selected tab
  const filteredGoals = goals.filter(goal => {
    const completed = goal.currentAmount >= goal.targetAmount;
    
    if (filter === 'active') return !completed;
    if (filter === 'completed') return completed;
    return true; // 'all'
  });

  const activeCount = goals.filter(g => g.currentAmount < g.targetAmount).length;
  const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const removeGoal = async (goal: SavingsGoal) => {
    try {
      await deleteSavingsGoal(goal.id);
      const data = await getSavingsGoals(currentAccountId!);
      setGoals(data);
    } catch (error) {
      console.error("FAILED TO DELETE SAVINGS GOAL:", error);
      Alert.alert("Delete Failed", "Could not delete the savings goal.");
    }
  };

  const confirmDeleteGoal = (goal: SavingsGoal) => {
    const message = `"${goal.name}" and all its contributions will be permanently deleted.`;

    if (Platform.OS === "web") {
      if (window.confirm(`Delete Savings Goal?\n\n${message}`)) {
        void removeGoal(goal);
      }
      return;
    }

    Alert.alert("Delete Savings Goal?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void removeGoal(goal) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <PageBackButton
          onPress={() => router.back()}
          style={{ marginBottom: 0, marginLeft: 0, marginRight: 4 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Savings Goals</Text>
          <Text style={styles.headerSubtitle}>Ajo discipline. Personal success.</Text>
        </View>
        <Pressable
          onPress={() => router.push("/create-goal")}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={screenStyles.root}
        contentContainerStyle={screenStyles.scrollContent}
      >
      {/* Filter Tabs */}
      {goals.length > 0 && (
        <View style={styles.filterTabs}>
          <Pressable
            onPress={() => setFilter('active')}
            style={[
              styles.filterTab,
              filter === 'active' && styles.filterTabActive
            ]}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'active' && styles.filterTabTextActive
            ]}>
              Active {activeCount > 0 && `(${activeCount})`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('completed')}
            style={[
              styles.filterTab,
              filter === 'completed' && styles.filterTabActive
            ]}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'completed' && styles.filterTabTextActive
            ]}>
              Completed {completedCount > 0 && `(${completedCount})`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive
            ]}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive
            ]}>
              All ({goals.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Goals */}

      {filteredGoals.length === 0 ? (
        <View style={[screenStyles.emptyState, { gap: 12 }]}>
          <Ionicons
            name={filter === 'completed' ? "checkmark-circle-outline" : "people-outline"}
            size={64}
            color={colors.borderInput}
            style={{ marginBottom: 8 }}
          />

          <Text style={screenStyles.sectionTitle}>
            {filter === 'completed' 
              ? 'No completed goals yet'
              : filter === 'active'
              ? 'No active goals'
              : 'No savings goals yet'
            }
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {filter === 'completed'
              ? 'Complete a goal to see it here. Keep saving!'
              : filter === 'active'
              ? goals.length > 0 
                ? 'All your goals are completed! Start a new one?'
                : 'Start your first goal with Ajo-inspired discipline.'
              : 'Start your first goal with Ajo-inspired discipline. Regular contributions, tracked progress, real results.'
            }
          </Text>

          {(filter === 'active' || filter === 'all') && (
            <Pressable
              onPress={() => router.push("/create-goal")}
              style={[
                screenStyles.primaryButton,
                { marginTop: 8, paddingHorizontal: 20 },
              ]}
            >
              <Text style={screenStyles.primaryButtonText}>
                Start Saving
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {filteredGoals.map((goal) => {
            const percentage =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;

            const remaining = goal.targetAmount - goal.currentAmount;
            const completed = goal.currentAmount >= goal.targetAmount;
            const isAlmostThere = percentage >= 80 && !completed;
            const progressColor = completed ? colors.success : colors.primary;
            const estimatedPayments = goal.suggestedAmount > 0
              ? Math.ceil(remaining / goal.suggestedAmount)
              : null;
              
            // Calculate days remaining if target date exists
            let daysRemaining: number | null = null;
            let isOverdue = false;
            if (goal.targetDate && !completed) {
              const now = new Date();
              const target = new Date(goal.targetDate);
              const diffTime = target.getTime() - now.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              isOverdue = daysRemaining < 0;
            }
            
            const paymentIsDue = isPaymentDue(goal);
            const paymentIsOverdue = isPaymentOverdue(goal);

            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  (paymentIsDue || paymentIsOverdue) && styles.paymentDueCard,
                ]}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={completed ? colors.success : colors.secondary}
                    />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${goal.name}`}
                      onPress={() => router.push(`/goal/${goal.id}`)}
                    >
                      <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                      <View style={styles.goalStatusRow}>
                        {completed ? (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                            <Text style={styles.completedText}>Completed</Text>
                          </View>
                        ) : paymentIsOverdue ? (
                          <View style={styles.overdueBadge}>
                            <Ionicons name="alert-circle" size={13} color={colors.error} />
                            <Text style={styles.overdueText}>Payment overdue</Text>
                          </View>
                        ) : paymentIsDue ? (
                          <View style={styles.paymentDueBadge}>
                            <Ionicons name="time" size={13} color={colors.secondary} />
                            <Text style={styles.paymentDueText}>Payment due</Text>
                          </View>
                        ) : isAlmostThere ? (
                          <View style={styles.almostThereBadge}>
                            <Ionicons name="trending-up" size={13} color={colors.secondary} />
                            <Text style={styles.almostThereText}>Almost there</Text>
                          </View>
                        ) : (
                          <Text style={styles.goalSubtitle}>{goal.frequency} goal</Text>
                        )}
                      </View>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${goal.name}`}
                    onPress={() => confirmDeleteGoal(goal)}
                    style={styles.integratedDeleteButton}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.error} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View progress for ${goal.name}`}
                  onPress={() => router.push(`/goal/${goal.id}`)}
                  style={styles.goalCardBody}
                >
                  {goal.description && (
                    <Text style={styles.goalDescription} numberOfLines={2}>
                      {goal.description}
                    </Text>
                  )}

                <View style={styles.amountRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.amountLabel}>SAVED</Text>
                    <Text style={styles.savedAmount} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(goal.currentAmount, currencyCode)}
                    </Text>
                  </View>
                  <View style={styles.amountTarget}>
                    <Text style={styles.amountLabel}>TARGET</Text>
                    <Text style={styles.targetAmount} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(goal.targetAmount, currencyCode)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
                  </View>
                  <Text style={styles.progressPercent}>{percentage.toFixed(0)}%</Text>
                </View>

                <View style={styles.cardFooter}>
                  {goal.streak > 0 && (
                    <View style={styles.metaInfoItem}>
                      <Ionicons name="flame" size={15} color={colors.warning} />
                      <Text style={styles.metaInfoText}>{goal.streak}</Text>
                    </View>
                  )}
                  {goal.nextDueDate && !completed && (
                    <View style={styles.metaInfoItem}>
                      <Ionicons name="alarm-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaInfoText}>
                        {new Date(goal.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  )}
                </View>

                {!completed && (
                  <View style={styles.footerRow}>
                    <View>
                      <Text style={styles.footerText}>STILL TO SAVE</Text>
                      <Text style={styles.remainingAmount}>{formatCurrency(remaining, currencyCode)}</Text>
                    </View>
                    <View style={styles.footerRight}>
                      {estimatedPayments !== null && (
                        <Text style={styles.footerText}>{estimatedPayments} {estimatedPayments === 1 ? "payment" : "payments"}</Text>
                      )}
                      {daysRemaining !== null && (
                        <Text style={[styles.footerTextRight, isOverdue && { color: colors.error }]}>
                          {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.secondary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderInput,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    position: "relative",
    overflow: 'hidden',
  },
  paymentDueCard: {
    borderColor: `${colors.warning}80`,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${colors.primary}35`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  goalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  integratedDeleteButton: {
    minWidth: 82,
    height: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    backgroundColor: `${colors.error}08`,
    borderWidth: 1,
    borderColor: `${colors.error}35`,
  },
  deleteButtonText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "700",
  },
  goalCardBody: {
    gap: 16,
  },
  goalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  paymentDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paymentDueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  almostThereBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  almostThereText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 2,
  },
  amountTarget: {
    flex: 1,
    alignItems: "flex-end",
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  savedAmount: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  targetAmount: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 9,
    backgroundColor: colors.borderInput,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercent: {
    minWidth: 38,
    textAlign: "right",
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 20,
  },
  metaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderInput,
    paddingTop: 13,
    marginTop: -3,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  remainingAmount: {
    marginTop: 3,
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
  },
  footerRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  footerTextRight: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
