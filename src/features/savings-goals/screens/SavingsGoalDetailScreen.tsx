import { useEffect, useState } from "react";

import { router } from "expo-router";

import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { SavingsGoal } from "../../../types/savingsGoal";

import {
  deleteSavingsGoal,
  getSavingsGoal,
  updateSavingsGoal,
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
  
  const [goal, setGoal] =
    useState<SavingsGoal | null>(null);

  const [currentAmount, setCurrentAmount] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    async function loadGoal() {
      try {
        setLoading(true);

        const data =
          await getSavingsGoal(goalId);

        setGoal(data);

        if (data) {
          setCurrentAmount(
            String(data.currentAmount),
          );
        }
      } catch (error) {
        console.error(
          "FAILED TO LOAD SAVINGS GOAL:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadGoal();
  }, [goalId]);

  const handleUpdateSavings = async () => {
    if (!goal) return;

    const numericAmount =
      Number(currentAmount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount < 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid saved amount.",
      );

      return;
    }

    try {
      setSaving(true);

      const updatedGoal: SavingsGoal = {
        ...goal,
        currentAmount: numericAmount,
        updatedAt: new Date().toISOString(),
      };

      await updateSavingsGoal(updatedGoal);

      setGoal(updatedGoal);

      Alert.alert(
        "Savings updated",
        "Your goal progress has been updated.",
      );
    } catch (error) {
      console.error(
        "FAILED TO UPDATE SAVINGS GOAL:",
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Savings Goal?",
      "This goal and its progress will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              await deleteSavingsGoal(goalId);

              Alert.alert(
                "Goal Deleted",
                "Your savings goal has been deleted.",
                [
                  {
                    text: "OK",
                    onPress: () => router.push("/savings-goals"),
                  },
                ],
              );
            } catch (error) {
              console.error(
                "FAILED TO DELETE SAVINGS GOAL:",
                error,
              );

              Alert.alert(
                "Delete Failed",
                "Could not delete the savings goal. Please try again.",
              );

              setDeleting(false);
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

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading goal...
        </Text>
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
    goal.targetAmount > 0
      ? Math.min(
          (goal.currentAmount /
            goal.targetAmount) *
            100,
          100,
        )
      : 0;

  const completed =
    goal.currentAmount >=
    goal.targetAmount;

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>{goal.name}</Text>

        <Text style={screenStyles.subtitle}>
          Track your progress towards this goal.
        </Text>
      </View>

      {/* Progress */}

      <View style={[screenStyles.card, { gap: 12 }]}>
        <Text style={screenStyles.sectionTitle}>
          {completed
            ? "🎉 Goal Completed!"
            : `${percentage.toFixed(0)}% Complete`}
        </Text>

        <Text style={{ color: colors.textSecondary }}>
          {formatCurrency(goal.currentAmount, currencyCode)} saved
        </Text>

        <Text style={{ color: colors.textSecondary }}>
          Target: {formatCurrency(goal.targetAmount, currencyCode)}
        </Text>

        <View
          style={{
            height: 12,
            backgroundColor: colors.borderInput,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: colors.secondary,
            }}
          />
        </View>
      </View>

      {/* Update Savings */}

      <View style={{ gap: 10 }}>
        <Text style={screenStyles.sectionTitle}>Update Savings</Text>

        <Text style={{ color: colors.textSecondary }}>
          Enter the total amount you have saved so far.
        </Text>

        <TextInput
          value={currentAmount}
          onChangeText={setCurrentAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={screenStyles.input}
        />

        <Pressable
          onPress={handleUpdateSavings}
          disabled={saving}
          style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
        >
          <Text style={screenStyles.primaryButtonText}>
            {saving
              ? "Updating..."
              : "Update Progress"}
          </Text>
        </Pressable>
      </View>

      {/* Delete */}

      <Pressable
        onPress={handleDelete}
        disabled={deleting}
        style={[
          screenStyles.outlineButton,
          {
            borderColor: colors.error,
            opacity: deleting ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            screenStyles.outlineButtonText,
            { color: colors.error },
          ]}
        >
          {deleting
            ? "Deleting..."
            : "Delete Goal"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
