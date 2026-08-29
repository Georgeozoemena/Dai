import { useEffect, useState } from "react";

import { Pressable, ScrollView, Text, View, TextInput } from "react-native";

import {
  formatWeekRange,
  getNextWeek,
  getPreviousWeek,
  getWeekEnd,
  getWeekStart,
} from "../services/weeklyCalculationService";

import type { Transaction } from "../../../types/transaction";

import { useAccountStore } from "../../../store/account/accountStore";

import { getTransactions } from "../../transactions/services/transactionService";

import type { WeeklyReview } from "../../../types/weeklyReview";

import {
  getWeeklyReview,
  saveWeeklyReview,
} from "../services/weeklyReviewService";

export function WeeklyReviewScreen() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const currentAccountId = useAccountStore((state) => state.currentAccountId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [reflectionOne, setReflectionOne] = useState("");

  const [reflectionTwo, setReflectionTwo] = useState("");

  const [reflectionThree, setReflectionThree] = useState("");

  const [savingReview, setSavingReview] = useState(false);

  const weekEnd = getWeekEnd(weekStart);

  const weeklyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return transactionDate >= weekStart && transactionDate <= weekEnd;
  });

  const weeklyIncome = weeklyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const weeklySpent = weeklyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const weeklySaved = weeklyIncome - weeklySpent;

  const weeklyEntries = weeklyTransactions.length;

  const handlePreviousWeek = () => {
    setWeekStart(getPreviousWeek(weekStart));
  };

  const handleNextWeek = () => {
    setWeekStart(getNextWeek(weekStart));
  };

  const categorySpending = weeklyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (categories, transaction) => {
        const category = transaction.category;

        categories[category] = (categories[category] || 0) + transaction.amount;

        return categories;
      },
      {} as Record<string, number>,
    );

  const categorySummaries = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  useEffect(() => {
    async function loadTransactions() {
      if (!currentAccountId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await getTransactions(currentAccountId);

        setTransactions(data);
      } catch (error) {
        console.error("FAILED TO LOAD WEEKLY TRANSACTIONS:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [currentAccountId]);

  useEffect(() => {
    async function loadWeeklyReview() {
      if (!currentAccountId) {
        setReflectionOne("");
        setReflectionTwo("");
        setReflectionThree("");
        return;
      }

      try {
        const review = await getWeeklyReview(
          currentAccountId,
          weekStart.toISOString(),
        );

        if (review) {
          setReflectionOne(review.reflectionOne ?? "");

          setReflectionTwo(review.reflectionTwo ?? "");

          setReflectionThree(review.reflectionThree ?? "");
        } else {
          setReflectionOne("");
          setReflectionTwo("");
          setReflectionThree("");
        }
      } catch (error) {
        console.error("FAILED TO LOAD WEEKLY REVIEW:", error);
      }
    }

    loadWeeklyReview();
  }, [currentAccountId, weekStart]);

  const handleSaveReview = async () => {
    if (!currentAccountId) {
      console.log("NO ACCOUNT SELECTED");
      return;
    }

    try {
      setSavingReview(true);

      const now = new Date().toISOString();

      const review: WeeklyReview = {
        id: `${currentAccountId}-${weekStart.toISOString()}`,
        accountId: currentAccountId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),

        reflectionOne: reflectionOne.trim() || undefined,

        reflectionTwo: reflectionTwo.trim() || undefined,

        reflectionThree: reflectionThree.trim() || undefined,

        createdAt: now,
        updatedAt: now,
      };

      await saveWeeklyReview(review);

      console.log("WEEKLY REVIEW SAVED:", review);
    } catch (error) {
      console.error("FAILED TO SAVE WEEKLY REVIEW:", error);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      {/* Header */}

      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Weekly Review
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          Take a moment to understand your financial week.
        </Text>
      </View>

      {/* Week Navigation */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={handlePreviousWeek}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            ← Previous
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {formatWeekRange(weekStart, weekEnd)}
        </Text>

        <Pressable
          onPress={handleNextWeek}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Next →
          </Text>
        </Pressable>
      </View>

      {/* Placeholder */}

      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          This Week
        </Text>

        {loading ? (
          <Text style={{ color: "#666" }}>Loading weekly summary...</Text>
        ) : (
          <View
            style={{
              gap: 12,
            }}
          >
            <View
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#666" }}>Income</Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                ₦{weeklyIncome.toLocaleString()}
              </Text>
            </View>

            <View
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#666" }}>Spent</Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                ₦{weeklySpent.toLocaleString()}
              </Text>
            </View>

            <View
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#666" }}>Saved</Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                ₦{weeklySaved.toLocaleString()}
              </Text>
            </View>

            <View
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#666" }}>Entries</Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                {weeklyEntries}
              </Text>
            </View>
          </View>
        )}
        <View style={{ gap: 14 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Spending by Category
          </Text>

          {categorySummaries.length === 0 ? (
            <Text style={{ color: "#666" }}>
              No expenses recorded this week.
            </Text>
          ) : (
            <View style={{ gap: 14 }}>
              {categorySummaries.map((item) => {
                const percentage =
                  weeklySpent > 0 ? (item.amount / weeklySpent) * 100 : 0;

                return (
                  <View key={item.category} style={{ gap: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {item.category}
                      </Text>

                      <Text
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        ₦{item.amount.toLocaleString()}
                      </Text>
                    </View>

                    {/* Progress bar */}

                    <View
                      style={{
                        height: 8,
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
                          borderRadius: 10,
                        }}
                      />
                    </View>

                    <Text
                      style={{
                        fontSize: 13,
                        color: "#666",
                      }}
                    >
                      {percentage.toFixed(0)}% of your weekly spending
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ gap: 16 }}>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Weekly Reflection
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: "#666",
              }}
            >
              Take a moment to reflect on your financial week.
            </Text>
          </View>

          {/* Question 1 */}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              What went well financially this week?
            </Text>

            <TextInput
              value={reflectionOne}
              onChangeText={setReflectionOne}
              placeholder="Write your thoughts..."
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 14,
                padding: 14,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Question 2 */}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              What could you improve next week?
            </Text>

            <TextInput
              value={reflectionTwo}
              onChangeText={setReflectionTwo}
              placeholder="Write your thoughts..."
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 14,
                padding: 14,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Question 3 */}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              What is one financial goal for next week?
            </Text>

            <TextInput
              value={reflectionThree}
              onChangeText={setReflectionThree}
              placeholder="Write your thoughts..."
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 14,
                padding: 14,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Save */}

          <Pressable
            onPress={handleSaveReview}
            disabled={savingReview}
            style={{
              backgroundColor: "#111",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              opacity: savingReview ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {savingReview ? "Saving..." : "Save Weekly Review"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
