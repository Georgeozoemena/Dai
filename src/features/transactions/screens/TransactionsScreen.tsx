import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Transaction } from "../../../types/transaction";

import { useAccountStore } from "../../../store/account/accountStore";

import { getAccount } from "../../accounts/services/accountService";

import { getTransactions } from "../services/transactionService";

import {
  filterTransactions,
  type TransactionFilter,
} from "../services/transactionFilterService";

import { formatCurrency } from "../../../utils/currency";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

export function TransactionsScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [accountName, setAccountName] = useState("");

  const [filter, setFilter] = useState<TransactionFilter>("all");

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadTransactions() {
        if (!currentAccountId) {
          setAccountName("");
          setTransactions([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const account = await getAccount(currentAccountId);

          if (account) {
            setAccountName(account.name);
          }

          const data = await getTransactions(currentAccountId);

          setTransactions(data);
        } catch (error) {
          console.error("FAILED TO LOAD TRANSACTIONS:", error);
        } finally {
          setLoading(false);
        }
      }

      loadTransactions();
    }, [currentAccountId]),
  );

  const filteredTransactions = filterTransactions(transactions, filter);

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

        <Text style={{ marginTop: 12 }}>Loading transactions...</Text>
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
          Select an account to view your transactions.
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
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Transactions
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          {accountName}
        </Text>
      </View>

      {/* Filters */}

      <View
        style={{
          flexDirection: "row",
          gap: 8,
        }}
      >
        {(["all", "income", "expense"] as TransactionFilter[]).map((item) => {
          const selected = filter === item;

          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: selected ? "#111" : "#eee",
              }}
            >
              <Text
                style={{
                  color: selected ? "#fff" : "#111",
                  fontWeight: "600",
                }}
              >
                {item === "all"
                  ? "All"
                  : item === "income"
                    ? "Income"
                    : "Expenses"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Transactions */}

      {filteredTransactions.length === 0 ? (
        <View
          style={{
            paddingVertical: 40,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            No transactions
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#666",
            }}
          >
            Nothing to show here yet.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredTransactions.map((transaction) => {
            const isExpense = transaction.type === "expense";

            return (
              <Pressable
                key={transaction.id}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
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
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      paddingRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {transaction.category}
                    </Text>

                    {transaction.description && (
                      <Text
                        style={{
                          marginTop: 4,
                          color: "#666",
                        }}
                      >
                        {transaction.description}
                      </Text>
                    )}

                    <Text
                      style={{
                        marginTop: 6,
                        color: "#999",
                      }}
                    >
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {isExpense ? "-" : "+"}
                    {formatCurrency(transaction.amount, currencyCode)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
