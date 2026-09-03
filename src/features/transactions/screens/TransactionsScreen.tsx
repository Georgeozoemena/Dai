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
      <View style={screenStyles.centered}>
        <Text style={screenStyles.title}>No account selected</Text>

        <Text style={[screenStyles.subtitle, { textAlign: "center" }]}>
          Select an account to view your transactions.
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
