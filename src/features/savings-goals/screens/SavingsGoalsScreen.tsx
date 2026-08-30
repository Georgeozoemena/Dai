import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { SavingsGoal } from "../../../types/savingsGoal";

import { useAccountStore } from "../../../store/account/accountStore";

import { getSavingsGoals } from "../services/savingsGoalService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />

        <Text style={{ marginTop: 12 }}>Loading goals...</Text>
      </View>
    );
  }

  if (!currentAccountId) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          No account selected
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#666",
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
      contentContainerStyle={{
        padding: 24,
        gap: 20,
      }}
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
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
            }}
          >
            Savings Goals
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
            }}
          >
            Save towards what matters.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/create-goal")}
          style={{
            backgroundColor: "#111",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
            }}
          >
            + Add
          </Text>
        </Pressable>
      </View>

      {/* Goals */}

      {goals.length === 0 ? (
        <View
          style={{
            paddingVertical: 60,
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            No savings goals yet
          </Text>

          <Text
            style={{
              color: "#666",
              textAlign: "center",
            }}
          >
            Create a goal and start tracking your progress.
          </Text>

          <Pressable
            onPress={() => router.push("/create-goal")}
            style={{
              marginTop: 8,
              backgroundColor: "#111",
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
              }}
            >
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
                style={{
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 16,
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
                      fontSize: 18,
                      fontWeight: "700",
                      flex: 1,
                    }}
                  >
                    {goal.name}
                  </Text>

                  {completed && (
                    <Text
                      style={{
                        fontWeight: "700",
                      }}
                    >
                      🎉 Complete
                    </Text>
                  )}
                </View>

                <Text style={{ color: "#666" }}>
                  {formatCurrency(goal.currentAmount, currencyCode)} of{" "}
                  {formatCurrency(goal.targetAmount, currencyCode)}
                </Text>

                {/* Progress Bar */}

                <View
                  style={{
                    height: 10,
                    backgroundColor: "#e5e5e5",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: "#111",
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#666",
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
