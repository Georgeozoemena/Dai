import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Transaction } from "../../../types/transaction";

import { useAccountStore } from "../../../store/account/accountStore";

import { getAccount } from "../../accounts/services/accountService";

import {
  getTransactions,
} from "../../transactions/services/transactionService";

import {
  calculateDashboardSummary,
} from "../services/dashboardService";

export function DashboardScreen() {
  const currentAccountId =
    useAccountStore(
      (state) => state.currentAccountId,
    );

  const [accountName, setAccountName] =
    useState("");

  const [currencySymbol, setCurrencySymbol] =
    useState("");

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!currentAccountId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const account =
          await getAccount(
            currentAccountId,
          );

        if (account) {
          setAccountName(account.name);

          if (
            account.currencyCode === "NGN"
          ) {
            setCurrencySymbol("₦");
          } else if (
            account.currencyCode === "USD"
          ) {
            setCurrencySymbol("$");
          } else if (
            account.currencyCode === "EUR"
          ) {
            setCurrencySymbol("€");
          } else if (
            account.currencyCode === "GBP"
          ) {
            setCurrencySymbol("£");
          } else {
            setCurrencySymbol(
              account.currencyCode,
            );
          }
        }

        const data =
          await getTransactions(
            currentAccountId,
          );

        setTransactions(data);
      } catch (error) {
        console.error(
          "FAILED TO LOAD DASHBOARD:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [currentAccountId]);

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
        <Text style={{ marginTop: 12 }}>Loading dashboard...</Text>
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
        <Pressable
          onPress={() =>
            router.push("/(tabs)/accounts")
          }
          style={{
            marginTop: 20,
            backgroundColor: "#111",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "600",
            }}
          >
            Select Account
          </Text>
        </Pressable>
      </View>
    );
  }

  const summary =
    calculateDashboardSummary(
      transactions,
    );

  const recentTransactions =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 5);

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
            fontSize: 16,
            color: "#666",
          }}
        >
          Welcome back
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          {accountName}
        </Text>
      </View>

      {/* Account Switcher */}
      <Pressable
        onPress={() =>
          router.push("/(tabs)/accounts")
        }
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="wallet-outline" size={24} color="#666" />
          <View>
            <Text
              style={{
                fontSize: 13,
                color: "#666",
              }}
            >
              Current account
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {accountName}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </Pressable>

      {/* Balance */}
      <View
        style={{
          backgroundColor: "#111",
          borderRadius: 18,
          padding: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="cash-outline" size={20} color="#aaa" />
          <Text
            style={{
              color: "#aaa",
            }}
          >
            Balance
          </Text>
        </View>
        <Text
          style={{
            marginTop: 8,
            color: "#fff",
            fontSize: 36,
            fontWeight: "700",
          }}
        >
          {currencySymbol}
          {summary.balance.toLocaleString()}
        </Text>
      </View>

      {/* Income / Expenses */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="arrow-down-circle-outline" size={16} color="#4caf50" />
            <Text style={{ color: "#666" }}>Income</Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {currencySymbol}
            {summary.income.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="#f44336" />
            <Text style={{ color: "#666" }}>Expenses</Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {currencySymbol}
            {summary.expenses.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          Quick Actions
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() =>
              router.push("/expense")
            }
            style={{
              flex: 1,
              backgroundColor: "#111",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="remove-circle-outline" size={20} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Expense
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push("/income")
            }
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#111" />
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              Income
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Transactions */}
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Recent Transactions
          </Text>
          <Pressable
            onPress={() =>
              router.push("/(tabs)/activity")
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              See all
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#111" />
          </Pressable>
        </View>
        {recentTransactions.length ===
        0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "#666",
                textAlign: "center",
              }}
            >
              No transactions yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recentTransactions.map(
              (transaction) => {
                const isExpense =
                  transaction.type ===
                  "expense";

                return (
                  <Pressable
                    key={transaction.id}
                    onPress={() =>
                      router.push(
                        `/transaction/${transaction.id}`,
                      )
                    }
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection:
                          "row",
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            transaction.category
                          }
                        </Text>
                        {transaction.description && (
                          <Text
                            style={{
                              marginTop: 4,
                              color: "#666",
                            }}
                          >
                            {
                              transaction.description
                            }
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                        }}
                      >
                        {isExpense
                          ? "-"
                          : "+"}
                        {currencySymbol}
                        {transaction.amount.toLocaleString()}
                      </Text>
                    </View>
                  </Pressable>
                );
              },
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
