import { useEffect, useState } from "react";

import { router } from "expo-router";

import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { SavingsGoal, SavingsContribution } from "../../../types/savingsGoal";

import {
  deleteSavingsGoal,
  getSavingsGoal,
  updateSavingsGoal,
  getContributions,
  createContribution,
  deleteContribution,
  makeScheduledPayment,
  getGoalStats,
  isPaymentDue,
  isPaymentOverdue,
} from "../services/savingsGoalService";
import { sendImmediateReminder } from "../services/savingsReminderService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";
import { colors, screenStyles } from "../../../theme";
import { PageBackButton } from "../../../components/PageBackButton";

interface SavingsGoalDetailScreenProps {
  goalId: string;
}

export function SavingsGoalDetailScreen({
  goalId,
}: SavingsGoalDetailScreenProps) {
  const currencyCode = useAccountCurrency();
  
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  const loadGoalData = async () => {
    try {
      setLoading(true);

      const [goalData, contributionsData] = await Promise.all([
        getSavingsGoal(goalId),
        getContributions(goalId),
      ]);

      console.log('=== LOADED GOAL DATA ===');
      console.log('Goal ID:', goalId);
      console.log('Current Amount:', goalData?.currentAmount);
      console.log('Target Amount:', goalData?.targetAmount);
      console.log('Contributions Count:', contributionsData.length);
      console.log('======================');

      setGoal(goalData);
      setContributions(contributionsData);

      if (goalData) {
        setEditName(goalData.name);
        setEditDescription(goalData.description || "");
        setEditTargetAmount(String(goalData.targetAmount));
        setEditTargetDate(goalData.targetDate || "");
      }
    } catch (error) {
      console.error("FAILED TO LOAD SAVINGS GOAL:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!goal) return;

    const amount = Number(contributionAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid contribution amount.");
      return;
    }

    try {
      setSaving(true);

      const contribution: SavingsContribution = {
        id: `${Date.now()}`,
        goalId: goal.id,
        amount,
        note: contributionNote.trim() || undefined,
        date: new Date().toISOString(),
        isScheduledPayment: false,
        createdAt: new Date().toISOString(),
      };

      await createContribution(contribution);
      
      // Reload goal data to reflect updated amounts
      await loadGoalData();
      
      setContributionAmount("");
      setContributionNote("");

      Alert.alert("Contribution Added", `Added ${formatCurrency(amount, currencyCode)} to your goal!`);
    } catch (error) {
      console.error("FAILED TO ADD CONTRIBUTION:", error);
      Alert.alert("Something went wrong", "Could not add contribution.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleMakeScheduledPayment = async () => {
    if (!goal) return;
    
    try {
      setSaving(true);
      console.log('=== BEFORE PAYMENT ===');
      console.log('Current Amount:', goal.currentAmount);
      console.log('Suggested Amount:', goal.suggestedAmount);
      
      await makeScheduledPayment(goal.id);
      await loadGoalData();
      
      const newStreak = (goal.streak || 0) + 1;
      
      Alert.alert(
        "Payment Made! 🤝",
        `Your payment of ${formatCurrency(goal.suggestedAmount, currencyCode)} has been recorded.\n\nStreak: ${newStreak} payments 🔥`,
      );
    } catch (error) {
      console.error("FAILED TO MAKE SCHEDULED PAYMENT:", error);
      Alert.alert("Something went wrong", "Could not process payment.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!goal) return;

    if (!editName.trim()) {
      Alert.alert("Goal name required", "Please enter a name for your goal.");
      return;
    }

    const numericTarget = Number(editTargetAmount);
    if (Number.isNaN(numericTarget) || numericTarget <= 0) {
      Alert.alert("Invalid target", "Please enter a valid target amount.");
      return;
    }

    try {
      setSaving(true);

      const updatedGoal: SavingsGoal = {
        ...goal,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        targetAmount: numericTarget,
        targetDate: editTargetDate || undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateSavingsGoal(updatedGoal);
      setGoal(updatedGoal);
      setShowEditMode(false);

      Alert.alert("Goal Updated", "Your goal has been updated successfully.");
    } catch (error) {
      console.error("FAILED TO UPDATE GOAL:", error);
      Alert.alert("Something went wrong", "Could not update goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('DELETE GOAL CLICKED:', goalId);
    Alert.alert(
      "Delete Savings Goal?",
      "This goal and all its contributions will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              console.log('DELETING GOAL:', goalId);
              await deleteSavingsGoal(goalId);

              Alert.alert("Goal Deleted", "Your savings goal has been deleted.", [
                { text: "OK", onPress: () => router.push("/savings-goals") },
              ]);
            } catch (error) {
              console.error("FAILED TO DELETE SAVINGS GOAL:", error);
              Alert.alert("Delete Failed", "Could not delete the savings goal. Please try again.");
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteContribution = (contribution: SavingsContribution) => {
    const removeContribution = async () => {
      try {
        await deleteContribution(
          contribution.id,
          contribution.goalId,
          contribution.amount,
        );

        const [updatedGoal, updatedContributions] = await Promise.all([
          getSavingsGoal(contribution.goalId),
          getContributions(contribution.goalId),
        ]);

        setGoal(updatedGoal);
        setContributions(updatedContributions);
        if (Platform.OS === "web") {
          window.alert("Contribution deleted.");
        } else {
          Alert.alert("Contribution Deleted", "The contribution has been removed.");
        }
      } catch (error) {
        console.error("FAILED TO DELETE CONTRIBUTION:", error);
        if (Platform.OS === "web") {
          window.alert("Could not delete the contribution. Please try again.");
        } else {
          Alert.alert("Delete Failed", "Could not delete the contribution.");
        }
      }
    };

    const message = "This contribution will be removed from your goal.";
    if (Platform.OS === "web") {
      if (window.confirm(`Delete Contribution?\n\n${message}`)) {
        void removeContribution();
      }
      return;
    }

    Alert.alert("Delete Contribution?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void removeContribution() },
    ]);
  };

  if (loading) {
    return (
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading goal...</Text>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.sectionTitle}>Goal not found</Text>
      </View>
    );
  }

  const percentage =
    goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

  const completed = goal.currentAmount >= goal.targetAmount;
  
  // Get comprehensive statistics
  const stats = getGoalStats(goal, contributions);

  return (
    <ScrollView style={screenStyles.root} contentContainerStyle={screenStyles.scrollContent}>
      <View style={styles.pageHeader}>
        <PageBackButton onPress={() => router.back()} style={styles.pageBackButton} />
        <Text style={styles.pageHeaderTitle}>Goal details</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showEditMode ? "Close edit goal" : "Edit goal"}
          onPress={() => setShowEditMode(!showEditMode)}
          style={styles.editButton}
        >
          <Ionicons name={showEditMode ? "close" : "create-outline"} size={21} color={colors.text} />
        </Pressable>
      </View>

      {/* Edit Mode */}
      {showEditMode && (
        <View style={styles.editContainer}>
          <Text style={screenStyles.sectionTitle}>Edit Goal</Text>

          <View style={{ gap: 8 }}>
            <Text style={screenStyles.label}>Goal Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. New Laptop"
              style={screenStyles.input}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={screenStyles.label}>Description</Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Add details"
              style={[screenStyles.input, { minHeight: 80 }]}
              multiline
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={screenStyles.label}>Target Amount</Text>
            <TextInput
              value={editTargetAmount}
              onChangeText={setEditTargetAmount}
              placeholder={`0.00 ${currencyCode}`}
              keyboardType="decimal-pad"
              style={screenStyles.input}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={screenStyles.label}>Target Date</Text>
            <TextInput
              value={editTargetDate}
              onChangeText={setEditTargetDate}
              placeholder="YYYY-MM-DD"
              style={screenStyles.input}
            />
          </View>

          <Pressable
            onPress={handleSaveEdits}
            disabled={saving}
            style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
          >
            <Text style={screenStyles.primaryButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={21} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>{completed ? "GOAL COMPLETE" : "SAVINGS GOAL"}</Text>
            <Text style={styles.heroName} numberOfLines={2}>{goal.name}</Text>
          </View>
          <View style={styles.heroPercentBadge}>
            <Text style={styles.heroPercentText}>{percentage.toFixed(0)}%</Text>
          </View>
        </View>

        {goal.description ? (
          <Text style={styles.heroDescription} numberOfLines={2}>{goal.description}</Text>
        ) : null}

        <View style={styles.progressAmounts}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressLabel}>SAVED SO FAR</Text>
            <Text style={styles.progressAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(goal.currentAmount, currencyCode)}
            </Text>
          </View>
          <View style={styles.heroTarget}>
            <Text style={styles.progressLabel}>TARGET</Text>
            <Text style={styles.progressTargetAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(goal.targetAmount, currencyCode)}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: completed ? colors.success : colors.primary,
              },
            ]}
          />
        </View>

        {goal.targetDate && !completed && (
          <View style={styles.targetDatePill}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.targetDateText}>
              Target {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
      </View>

      {/* Discipline Stats Card - Shown for ALL goals */}
      <View style={styles.disciplineStatsCard}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name="trophy" size={18} color={colors.secondary} />
          </View>
          <Text style={styles.disciplineStatsTitle}>Your Discipline</Text>
          {stats.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {stats.currentStreak}</Text>
            </View>
          )}
        </View>

        <View style={styles.disciplineStatsGrid}>
          <View style={styles.disciplineStatItem}>
            <Text style={styles.disciplineStatLabel}>Payments Made</Text>
            <Text style={styles.disciplineStatValue}>{stats.scheduledPaymentCount}</Text>
          </View>
          
          <View style={styles.disciplineStatItem}>
            <Text style={styles.disciplineStatLabel}>Compliance</Text>
            <Text style={[
              styles.disciplineStatValue,
              { color: stats.complianceRate >= 80 ? colors.success : stats.complianceRate >= 60 ? colors.primary : colors.error }
            ]}>
              {stats.complianceRate.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.disciplineStatItem}>
            <Text style={styles.disciplineStatLabel}>Missed</Text>
            <Text style={[
              styles.disciplineStatValue,
              stats.missedPayments > 0 && { color: colors.error }
            ]}>
              {stats.missedPayments}
            </Text>
          </View>
          
          <View style={styles.disciplineStatItem}>
            <Text style={styles.disciplineStatLabel}>Frequency</Text>
            <Text style={styles.disciplineStatValue}>
              {goal.frequency 
                ? `${goal.frequency.charAt(0).toUpperCase()}${goal.frequency.slice(1)}`
                : 'Monthly'
              }
            </Text>
          </View>
        </View>

        {goal.nextDueDate && !completed && (
          <View style={[
            styles.nextPayment,
            stats.isOverdue && styles.nextPaymentOverdue
          ]}>
            <Ionicons 
              name={stats.isOverdue ? "alert-circle" : "calendar"} 
              size={20} 
              color={stats.isOverdue ? colors.error : colors.textSecondary} 
            />
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.nextPaymentText,
                stats.isOverdue && { color: colors.error }
              ]}>
                {stats.isOverdue 
                  ? "Payment Overdue!" 
                  : stats.isDue 
                  ? "Payment Due Today" 
                  : "Next Payment"
                }
              </Text>
              <Text style={styles.nextPaymentDate}>
                {new Date(goal.nextDueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Scheduled Payment Button */}
        {!completed && (
          <>
            <Pressable
              onPress={handleMakeScheduledPayment}
              disabled={saving}
              style={[
                styles.scheduledPaymentButton,
                { opacity: saving ? 0.5 : 1 }
              ]}
            >
              <Ionicons name="wallet" size={20} color={colors.background} />
              <Text style={styles.scheduledPaymentButtonText}>
                Pay {formatCurrency(goal.suggestedAmount, currencyCode)} Now
              </Text>
            </Pressable>

            {/* Reminder Button */}
            <Pressable
              onPress={async () => {
                await sendImmediateReminder(goal);
                Alert.alert(
                  "Reminder Sent!",
                  "You'll receive a notification reminder for this goal."
                );
              }}
              style={styles.reminderButton}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
              <Text style={styles.reminderButtonText}>
                Remind Me
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Suggested Contributions - removed, since we now have fixed suggested amounts */}

      {/* Add Contribution */}
      {!completed && (
        <View style={styles.contributionForm}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="add" size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={screenStyles.sectionTitle}>Add a contribution</Text>
              <Text style={styles.contributionHint}>
            Add extra beyond your scheduled {formatCurrency(goal.suggestedAmount, currencyCode)} {goal.frequency} payment
              </Text>
            </View>
          </View>

          <TextInput
            value={contributionAmount}
            onChangeText={setContributionAmount}
            keyboardType="decimal-pad"
            placeholder={`Amount (${currencyCode})`}
            style={screenStyles.input}
          />

          <TextInput
            value={contributionNote}
            onChangeText={setContributionNote}
            placeholder="Note (optional)"
            style={screenStyles.input}
          />

          <Pressable
            onPress={handleAddContribution}
            disabled={saving}
            style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
          >
            <Text style={screenStyles.primaryButtonText}>
              {saving ? "Adding..." : "Add Extra Contribution"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Contribution History */}
      {contributions.length > 0 && (
        <View style={{ gap: 12 }}>
          <View style={styles.historyHeading}>
            <Text style={screenStyles.sectionTitle}>Activity</Text>
            <Text style={styles.historyCount}>{contributions.length}</Text>
          </View>

          {contributions.map((contribution) => (
            <View key={contribution.id} style={styles.contributionItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contributionAmount}>
                  +{formatCurrency(contribution.amount, currencyCode)}
                </Text>
                {contribution.note && (
                  <Text style={styles.contributionNote}>{contribution.note}</Text>
                )}
                <Text style={styles.contributionDate}>
                  {new Date(contribution.date).toLocaleDateString()}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete contribution of ${formatCurrency(contribution.amount, currencyCode)}`}
                onPress={() => handleDeleteContribution(contribution)}
                style={styles.deleteContributionBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Delete Goal */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete savings goal"
        onPress={handleDelete}
        disabled={deleting}
        style={[styles.deleteGoalButton, { opacity: deleting ? 0.5 : 1 }]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Text style={styles.deleteGoalText}>
          {deleting ? "Deleting..." : "Delete Goal"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageBackButton: {
    marginBottom: 0,
    marginLeft: 0,
  },
  pageHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  deleteGoalButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: `${colors.error}08`,
    borderWidth: 1,
    borderColor: `${colors.error}35`,
  },
  deleteGoalText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "700",
  },
  editContainer: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  contributionForm: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}35`,
  },
  contributionHint: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  historyHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  historyCount: {
    minWidth: 24,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressCard: {
    backgroundColor: colors.secondary,
    borderRadius: 26,
    padding: 22,
    gap: 20,
    overflow: "hidden",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}24`,
  },
  heroEyebrow: {
    color: `${colors.surface}99`,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 3,
  },
  heroName: {
    color: colors.surface,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  heroPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: `${colors.primary}20`,
  },
  heroPercentText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  heroDescription: {
    color: `${colors.surface}B8`,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -8,
  },
  progressAmounts: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: `${colors.surface}99`,
    marginBottom: 6,
  },
  progressAmount: {
    fontSize: 27,
    letterSpacing: -0.5,
    fontWeight: "700",
    color: colors.surface,
  },
  heroTarget: {
    alignItems: "flex-end",
  },
  progressTargetAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: `${colors.surface}D9`,
  },
  progressBar: {
    height: 9,
    backgroundColor: `${colors.surface}28`,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  targetDateText: {
    fontSize: 12,
    color: `${colors.surface}D9`,
    fontWeight: "600",
  },
  targetDatePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: `${colors.surface}14`,
    marginTop: -8,
  },
  disciplineStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  disciplineStatsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.background,
  },
  disciplineStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  disciplineStatItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  disciplineStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  disciplineStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  nextPayment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  nextPaymentOverdue: {
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  nextPaymentText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  nextPaymentDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scheduledPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  scheduledPaymentButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.background,
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  reminderButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.secondary,
  },
  suggestionsCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  suggestionAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  contributionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contributionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  contributionNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contributionDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  deleteContributionBtn: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
