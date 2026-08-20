import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAccountStore } from "../../../store/account/accountStore";

import { getAccount } from "../../accounts/services/accountService";

import { getDashboardData } from "../services/dashboardService";

import type { Transaction } from "../../transactions/../../types/transaction";

export function DashboardScreen() {
  const currentAccountId =
    useAccountStore(
      (state) => state.currentAccountId,
    );

  const [accountName, setAccountName] =
    useState("");

  const [currencySymbol, setCurrencySymbol] =
    useState("");

  const [income, setIncome] =
    useState(0);

  const [expenses, setExpenses] =
    useState(0);

  const [balance, setBalance] =
    useState(0);

  const [
    recentTransactions,
    setRecentTransactions,
  ] = useState<Transaction[]>([]);

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

        if (!account) {
          return;
        }

        setAccountName(account.name);

        if (account.currencyCode === "NGN") {
          setCurrencySymbol("₦");
        } else if (
          account.currencyCode === "USD"
        ) {
          setCurrencySymbol("$");
        } else if (
          account.currencyCode === "EUR"
        ) {
          setCurrencySymbol("€");
        } else {
          setCurrencySymbol(
            account.currencyCode,
          );
        }

        const data =
          await getDashboardData(
            currentAccountId,
          );

        setIncome(data.income);
        setExpenses(data.expenses);
        setBalance(data.balance);
        setRecentTransactions(
          data.recentTransactions,
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

        <Text style={{ marginTop: 12 }}>
          Loading dashboard...
        </Text>
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
          Select an account to view
          your dashboard.
        </Text>
      </View>
    );
  }

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
          {accountName}
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 36,
            fontWeight: "700",
          }}
        >
          {currencySymbol}
          {balance.toLocaleString()}
        </Text>

        <Text
          style={{
            marginTop: 4,
            color: "#666",
          }}
        >
          Current balance
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
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text style={{ color: "#666" }}>
            Income
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {currencySymbol}
            {income.toLocaleString()}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text style={{ color: "#666" }}>
            Expenses
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {currencySymbol}
            {expenses.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}

      <View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Quick Actions
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 12,
          }}
        >
          <Pressable
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              + Expense
            </Text>
          </Pressable>

          <Pressable
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
              }}
            >
              + Income
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Transactions */}

      <View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Recent Transactions
        </Text>

        {recentTransactions.length === 0 ? (
          <Text
            style={{
              marginTop: 12,
              color: "#666",
            }}
          >
            No transactions yet.
          </Text>
        ) : (
          <View
            style={{
              marginTop: 12,
              gap: 10,
            }}
          >
            {recentTransactions.map(
              (transaction) => (
                <View
                  key={transaction.id}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
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
                      {transaction.type ===
                      "expense"
                        ? "-"
                        : "+"}
                      {currencySymbol}
                      {transaction.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ),
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}