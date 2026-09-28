import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
import { colors, screenStyles } from "../../../theme";

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
      <View style={screenStyles.centered}>
        <ActivityIndicator color={colors.secondary} />

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading transactions...
        </Text>
      </View>
    );
  }

  if (!currentAccountId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            paddingBottom: 80,
          }}
        >
          {/* Activity/Receipt Ghost Illustration */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {/* Decorative elements */}
            <View
              style={{
                position: "absolute",
                left: -60,
                top: 30,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 60,
                  backgroundColor: "#E8E5E0",
                  borderRadius: 20,
                }}
              />
            </View>

            <View
              style={{
                position: "absolute",
                right: -60,
                top: 30,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 60,
                  backgroundColor: "#E8E5E0",
                  borderRadius: 20,
                }}
              />
            </View>

            {/* Blue activity/receipt ghost */}
            <View
              style={{
                width: 140,
                height: 140,
                backgroundColor: "#56CCF2",
                borderRadius: 70,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Curious eyes (one raised) */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 24,
                  marginTop: 20,
                  alignItems: "flex-end",
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 22,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 18,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 8,
                  }}
                />
              </View>

              {/* Surprised mouth (O shape) */}
              <View
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "transparent",
                  borderWidth: 3,
                  borderColor: "#1a1a1a",
                  borderRadius: 8,
                  marginTop: 16,
                }}
              />

              {/* Wave bottom */}
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 28,
                      height: 20,
                      backgroundColor: "#56CCF2",
                      borderBottomLeftRadius: 20,
                      borderBottomRightRadius: 20,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: 12,
              letterSpacing: -0.3,
            }}
          >
            No account selected
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#999999",
              textAlign: "center",
              lineHeight: 22,
              maxWidth: 280,
            }}
          >
            You have not selected any account yet. Select an account to view your transactions.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Transactions</Text>

        <Text style={screenStyles.subtitle}>{accountName}</Text>
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
              style={screenStyles.filterPill(selected)}
            >
              <Text style={screenStyles.filterPillText(selected)}>
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
        <View style={screenStyles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={colors.textMuted}
            style={{ marginBottom: 16 }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            No transactions
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: colors.textSecondary,
            }}
          >
            Nothing to show here yet.
          </Text>
        </View>
      ) : (
        <View style={screenStyles.listCard}>
          {filteredTransactions.map((transaction, index) => {
            const isExpense = transaction.type === "expense";
            const isLast = index === filteredTransactions.length - 1;

            return (
              <Pressable
                key={transaction.id}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
                style={screenStyles.listItem(isLast)}
              >
                <View style={screenStyles.iconCircle}>
                  <Ionicons
                    name={
                      isExpense ? "arrow-up-outline" : "arrow-down-outline"
                    }
                    size={20}
                    color={colors.surface}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {transaction.category}
                  </Text>

                  {transaction.description && (
                    <Text
                      style={{
                        marginTop: 4,
                        color: colors.textSecondary,
                      }}
                    >
                      {transaction.description}
                    </Text>
                  )}

                  <Text
                    style={{
                      marginTop: 6,
                      color: colors.textMuted,
                      fontSize: 12,
                    }}
                  >
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isExpense ? colors.secondary : colors.success,
                  }}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(transaction.amount, currencyCode)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
