import { useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAccountStore } from "../../../store/account/accountStore";

import { getTransactions } from "../../transactions/services/transactionService";

import { exportTransactionsToCsv } from "../services/exportService";

export function ExportTransactionsScreen() {
  const currentAccountId = useAccountStore(
    (state) => state.currentAccountId,
  );

  const [exporting, setExporting] =
    useState(false);

  const handleExport = async () => {
    if (!currentAccountId) {
      Alert.alert(
        "No account selected",
        "Please select an account before exporting transactions.",
      );

      return;
    }

    try {
      setExporting(true);

      const transactions =
        await getTransactions(currentAccountId);

      if (transactions.length === 0) {
        Alert.alert(
          "No transactions",
          "There are no transactions available to export.",
        );

        return;
      }

      await exportTransactionsToCsv(
        transactions,
      );

      Alert.alert(
        "Export Complete",
        `${transactions.length} transaction${
          transactions.length === 1 ? "" : "s"
        } exported successfully.`,
      );
    } catch (error) {
      console.error(
        "FAILED TO EXPORT TRANSACTIONS:",
        error,
      );

      Alert.alert(
        "Export Failed",
        "Something went wrong while exporting your transactions.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Export Transactions
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
            lineHeight: 22,
          }}
        >
          Download your transaction history as a CSV file.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 16,
          padding: 20,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          What will be exported?
        </Text>

        <Text style={{ color: "#666" }}>
          • Date
        </Text>

        <Text style={{ color: "#666" }}>
          • Transaction Type
        </Text>

        <Text style={{ color: "#666" }}>
          • Category
        </Text>

        <Text style={{ color: "#666" }}>
          • Description
        </Text>

        <Text style={{ color: "#666" }}>
          • Amount
        </Text>
      </View>

      <Pressable
        onPress={handleExport}
        disabled={exporting}
        style={{
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
          opacity: exporting ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {exporting
            ? "Exporting..."
            : "Export Transactions as CSV"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
