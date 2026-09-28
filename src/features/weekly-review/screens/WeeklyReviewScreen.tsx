import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

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

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";
import { colors } from "../../../theme";

export function WeeklyReviewScreen() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

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
      style={{ flex: 1, 
        backgroundColor: "#f5f5f5" 
      }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Weekly Review
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#999",
            lineHeight: 22,
          }}
        >
          Reflect on your financial journey
        </Text>
      </View>

      {/* Week Navigation Card */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <Pressable
          onPress={handlePreviousWeek}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#f5f5f5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 12,
              color: "#999",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Week
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1a1a1a",
            }}
          >
            {formatWeekRange(weekStart, weekEnd)}
          </Text>
        </View>

        <Pressable
          onPress={handleNextWeek}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#f5f5f5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#1a1a1a" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={{ marginTop: 12, color: "#999" }}>
            Loading weekly summary...
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* Income */}
            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="arrow-down" size={20} color="#10b981" />
              </View>
              <Text style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>
                Income
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#10b981",
                }}
              >
                {formatCurrency(weeklyIncome, currencyCode)}
              </Text>
            </View>

            {/* Spent */}
            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="arrow-up" size={20} color="#ef4444" />
              </View>
              <Text style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>
                Spent
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                {formatCurrency(weeklySpent, currencyCode)}
              </Text>
            </View>

            {/* Saved */}
            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(251, 204, 51, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="wallet" size={20} color={colors.secondary} />
              </View>
              <Text style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>
                Saved
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: weeklySaved >= 0 ? "#10b981" : "#ef4444",
                }}
              >
                {formatCurrency(weeklySaved, currencyCode)}
              </Text>
            </View>

            {/* Entries */}
            <View
              style={{
                flex: 1,
                minWidth: "47%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(139, 127, 214, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="receipt" size={20} color="#8B7FD6" />
              </View>
              <Text style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>
                Transactions
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                {weeklyEntries}
              </Text>
            </View>
          </View>

          {/* Category Spending */}
          {categorySummaries.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: 16,
                }}
              >
                Top Categories
              </Text>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  gap: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                {categorySummaries.slice(0, 5).map((item) => {
                  const percentage =
                    weeklySpent > 0 ? (item.amount / weeklySpent) * 100 : 0;

                  return (
                    <View key={item.category} style={{ gap: 10 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#1a1a1a",
                          }}
                        >
                          {item.category}
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#1a1a1a",
                          }}
                        >
                          {formatCurrency(item.amount, currencyCode)}
                        </Text>
                      </View>

                      <View
                        style={{
                          height: 6,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            backgroundColor: colors.secondary,
                            borderRadius: 3,
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          fontSize: 12,
                          color: "#999",
                        }}
                      >
                        {percentage.toFixed(0)}% of weekly spending
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Reflection Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: 8,
              }}
            >
              Weekly Reflection
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#999",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Take a moment to reflect on your financial decisions
            </Text>

            <View style={{ gap: 20 }}>
              {/* Question 1 */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1a1a1a",
                      flex: 1,
                    }}
                  >
                    What went well financially?
                  </Text>
                </View>
                <TextInput
                  value={reflectionOne}
                  onChangeText={setReflectionOne}
                  placeholder="Share your wins..."
                  placeholderTextColor="#ccc"
                  multiline
                  style={{
                    fontSize: 15,
                    color: "#1a1a1a",
                    minHeight: 80,
                    textAlignVertical: "top",
                    lineHeight: 22,
                  }}
                />
              </View>

              {/* Question 2 */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(251, 204, 51, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="trending-up" size={16} color={colors.secondary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1a1a1a",
                      flex: 1,
                    }}
                  >
                    What could you improve?
                  </Text>
                </View>
                <TextInput
                  value={reflectionTwo}
                  onChangeText={setReflectionTwo}
                  placeholder="Areas to work on..."
                  placeholderTextColor="#ccc"
                  multiline
                  style={{
                    fontSize: 15,
                    color: "#1a1a1a",
                    minHeight: 80,
                    textAlignVertical: "top",
                    lineHeight: 22,
                  }}
                />
              </View>

              {/* Question 3 */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(139, 127, 214, 0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="flag" size={16} color="#8B7FD6" />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1a1a1a",
                      flex: 1,
                    }}
                  >
                    Next week's goal?
                  </Text>
                </View>
                <TextInput
                  value={reflectionThree}
                  onChangeText={setReflectionThree}
                  placeholder="Set your intention..."
                  placeholderTextColor="#ccc"
                  multiline
                  style={{
                    fontSize: 15,
                    color: "#1a1a1a",
                    minHeight: 80,
                    textAlignVertical: "top",
                    lineHeight: 22,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSaveReview}
            disabled={savingReview}
            style={{
              backgroundColor: colors.secondary,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              opacity: savingReview ? 0.6 : 1,
              shadowColor: colors.secondary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.3,
              }}
            >
              {savingReview ? "Saving..." : "Save Review"}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
