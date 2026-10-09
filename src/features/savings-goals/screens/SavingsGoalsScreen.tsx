import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";

import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { SavingsGoal } from "../../../types/savingsGoal";

import { useAccountStore } from "../../../store/account/accountStore";

import { getSavingsGoals, isPaymentDue, isPaymentOverdue, deleteSavingsGoal } from "../services/savingsGoalService";

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

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="people" size={28} color={colors.secondary} />
            <Text style={screenStyles.title}>Savings Goals</Text>
          </View>

          <Text style={screenStyles.subtitle}>Ajo discipline. Personal success.</Text>
        </View>

        <Pressable
          onPress={() => router.push("/create-goal")}
          style={[
            screenStyles.primaryButton,
            { paddingHorizontal: 16, paddingVertical: 12 },
          ]}
        >
          <Text style={screenStyles.primaryButtonText}>+ Add</Text>
        </Pressable>
      </View>

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
            
            // Determine status and color
            const isAlmostThere = percentage >= 80 && !completed;
            const progressColor = completed 
              ? colors.success 
              : colors.secondary;
              
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
            
            // Payment status (all goals have this now)
            const paymentIsDue = isPaymentDue(goal);
            const paymentIsOverdue = isPaymentOverdue(goal);

            return (
              <Pressable
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                style={[
                  styles.goalCard,
                  paymentIsDue && styles.paymentDueCard,
                ]}
              >
                {/* Gradient Background for completed goals */}
                {completed && (
                  <LinearGradient
                    colors={['rgba(184, 243, 74, 0.1)', 'rgba(184, 243, 74, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.completedGradient}
                  />
                )}
                
                {/* Ajo Gradient Background for all active goals */}
                {!completed && (
                  <LinearGradient
                    colors={['rgba(184, 243, 74, 0.08)', 'rgba(184, 243, 74, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.completedGradient}
                  />
                )}

                {/* Header: Icon, Name, Status Badge, Delete */}
                <View style={styles.goalHeader}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={completed ? colors.success : colors.secondary} 
                    />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalSubtitle}>
                      {percentage.toFixed(0)}% • {formatCurrency(goal.currentAmount, currencyCode)} of {formatCurrency(goal.targetAmount, currencyCode)}
                    </Text>
                  </View>

                  {/* Status badges and delete button */}
                  <View style={styles.headerActions}>
                    {completed && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={styles.completedText}>Done</Text>
                      </View>
                    )}
                    
                    {paymentIsDue && !completed && (
                      <View style={styles.paymentDueBadge}>
                        <Ionicons name="time" size={12} color={colors.secondary} />
                        <Text style={styles.paymentDueText}>Due</Text>
                      </View>
                    )}
                    
                    {paymentIsOverdue && !completed && (
                      <View style={styles.overdueBadge}>
                        <Ionicons name="alert-circle" size={12} color={colors.error} />
                        <Text style={styles.overdueText}>Late</Text>
                      </View>
                    )}
                    
                    {isAlmostThere && !paymentIsDue && !paymentIsOverdue && (
                      <View style={styles.almostThereBadge}>
                        <Ionicons name="trending-up" size={12} color={colors.primary} />
                        <Text style={styles.almostThereText}>Almost!</Text>
                      </View>
                    )}

                    {/* Delete Button - Integrated */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log('DELETE GOAL CLICKED:', goal.id);
                        Alert.alert(
                          "Delete Savings Goal?",
                          `"${goal.name}" and all its contributions will be permanently deleted.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await deleteSavingsGoal(goal.id);
                                  const data = await getSavingsGoals(currentAccountId!);
                                  setGoals(data);
                                  Alert.alert("Goal Deleted", "Your savings goal has been deleted.");
                                } catch (error) {
                                  console.error("FAILED TO DELETE SAVINGS GOAL:", error);
                                  Alert.alert("Delete Failed", "Could not delete the savings goal.");
                                }
                              },
                            },
                          ],
                        );
                      }}
                      style={styles.integratedDeleteButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Description if available */}
                {goal.description && (
                  <Text style={styles.goalDescription} numberOfLines={2}>
                    {goal.description}
                  </Text>
                )}

                {/* Progress Bar - Thicker & More Prominent */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: progressColor,
                        }
                      ]}
                    />
                  </View>
                </View>

                {/* Meta Info Row with Icons */}
                <View style={styles.metaInfoRow}>
                  {goal.streak > 0 && (
                    <View style={styles.metaInfoItem}>
                      <Text style={styles.metaInfoIcon}>🔥</Text>
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
                  
                  <View style={styles.metaInfoItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaInfoText}>{goal.frequency}</Text>
                  </View>
                </View>

                {/* Footer: Summary */}
                {!completed && (
                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>
                      {formatCurrency(remaining, currencyCode)} to go • {Math.ceil(remaining / goal.suggestedAmount)} payments
                    </Text>
                    
                    {daysRemaining !== null && (
                      <Text style={[
                        styles.footerTextRight,
                        isOverdue && { color: colors.error }
                      ]}>
                        {isOverdue 
                          ? `${Math.abs(daysRemaining)}d overdue`
                          : `${daysRemaining}d left`
                        }
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    position: 'relative',
    overflow: 'hidden',
  },
  paymentDueCard: {
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  integratedDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.textMuted}10`,
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
  progressBarContainer: {
    paddingVertical: 2,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaInfoIcon: {
    fontSize: 14,
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
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  footerTextRight: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
