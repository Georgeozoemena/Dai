import { useEffect, useState } from "react";

import { router } from "expo-router";

import {
  Alert,
  ActivityIndicator,
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

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";
import { colors, screenStyles } from "../../../theme";

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
    console.log('DELETE CONTRIBUTION CLICKED:', contribution.id);
    Alert.alert(
      "Delete Contribution?",
      "This contribution will be removed from your goal.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('DELETING CONTRIBUTION:', contribution.id);
              await deleteContribution(contribution.id, contribution.goalId, contribution.amount);
              await loadGoalData();
              Alert.alert("Contribution Deleted", "The contribution has been removed.");
            } catch (error) {
              console.error("FAILED TO DELETE CONTRIBUTION:", error);
              Alert.alert("Delete Failed", "Could not delete the contribution.");
            }
          },
        },
      ],
    );
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
      {/* Header with Edit Button */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Ionicons name="people" size={24} color={colors.secondary} />
            <Text style={screenStyles.title}>{goal.name}</Text>
          </View>
          {goal.description && (
            <Text style={[screenStyles.subtitle, { marginTop: 4 }]}>{goal.description}</Text>
          )}
        </View>

        <Pressable
          onPress={() => setShowEditMode(!showEditMode)}
          style={{ padding: 8 }}
        >
          <Ionicons name={showEditMode ? "close" : "create-outline"} size={24} color={colors.text} />
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
        <Text style={styles.progressTitle}>
          {completed ? "Goal Completed!" : `${percentage.toFixed(0)}% Complete`}
        </Text>

        <View style={styles.progressAmounts}>
          <View>
            <Text style={styles.progressLabel}>Saved</Text>
            <Text style={styles.progressAmount}>
              {formatCurrency(goal.currentAmount, currencyCode)}
            </Text>
          </View>
          <Text style={styles.progressSeparator}>/</Text>
          <View>
            <Text style={styles.progressLabel}>Target</Text>
            <Text style={styles.progressAmount}>
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
                backgroundColor: completed ? colors.success : colors.secondary,
              },
            ]}
          />
        </View>

        {goal.targetDate && !completed && (
          <Text style={styles.targetDateText}>
            Target: {new Date(goal.targetDate).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Discipline Stats Card - Shown for ALL goals */}
      <View style={styles.disciplineStatsCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="trophy" size={24} color={colors.secondary} />
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
        )}
      </View>

      {/* Suggested Contributions - removed, since we now have fixed suggested amounts */}

      {/* Add Contribution */}
      {!completed && (
        <View style={{ gap: 10 }}>
          <Text style={screenStyles.sectionTitle}>Add Custom Contribution</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: -6 }}>
            Add extra beyond your scheduled {formatCurrency(goal.suggestedAmount, currencyCode)} {goal.frequency} payment
          </Text>

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
          <Text style={screenStyles.sectionTitle}>
            Contribution History ({contributions.length})
          </Text>

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
        onPress={handleDelete}
        disabled={deleting}
        style={[
          screenStyles.outlineButton,
          { borderColor: colors.error, opacity: deleting ? 0.5 : 1 },
        ]}
      >
        <Text style={[screenStyles.outlineButtonText, { color: colors.error }]}>
          {deleting ? "Deleting..." : "Delete Goal"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  editContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressCard: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
  },
  progressAmounts: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },
  progressSeparator: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: "200",
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.borderInput,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  targetDateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  disciplineStatsCard: {
    backgroundColor: `${colors.secondary}10`,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  disciplineStatsTitle: {
    fontSize: 20,
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
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
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
    borderRadius: 12,
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
    borderRadius: 14,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduledPaymentButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.background,
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
