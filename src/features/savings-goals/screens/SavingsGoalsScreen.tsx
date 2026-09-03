import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { SavingsGoal } from "../../../types/savingsGoal";

import { useAccountStore } from "../../../store/account/accountStore";

import { getSavingsGoals } from "../services/savingsGoalService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";
import { colors, screenStyles } from "../../../theme";

export function SavingsGoalsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);

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
          <Text style={screenStyles.title}>Savings Goals</Text>

          <Text style={screenStyles.subtitle}>Save towards what matters.</Text>
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

      {/* Goals */}

      {goals.length === 0 ? (
        <View style={[screenStyles.emptyState, { gap: 12 }]}>
          <Ionicons
            name="flag-outline"
            size={64}
            color={colors.borderInput}
            style={{ marginBottom: 8 }}
          />

          <Text style={screenStyles.sectionTitle}>No savings goals yet</Text>

          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            Create a goal and start tracking your progress.
          </Text>

          <Pressable
            onPress={() => router.push("/create-goal")}
            style={[
              screenStyles.primaryButton,
              { marginTop: 8, paddingHorizontal: 20 },
            ]}
          >
            <Text style={screenStyles.primaryButtonText}>
              Create Your First Goal
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {goals.map((goal) => {
            const percentage =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;

            const completed = goal.currentAmount >= goal.targetAmount;

            return (
              <Pressable
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                style={[screenStyles.card, { gap: 12 }]}
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
                      flex: 1,
                      color: colors.text,
                    }}
                  >
                    {goal.name}
                  </Text>

                  {completed && (
                    <Text
                      style={{
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      🎉 Complete
                    </Text>
                  )}
                </View>

                <Text style={{ color: colors.textSecondary }}>
                  {formatCurrency(goal.currentAmount, currencyCode)} of{" "}
                  {formatCurrency(goal.targetAmount, currencyCode)}
                </Text>

                {/* Progress Bar */}

                <View
                  style={{
                    height: 10,
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

                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  {percentage.toFixed(0)}% complete
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
