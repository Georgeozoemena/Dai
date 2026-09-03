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
import { colors, screenStyles } from "../../../theme";

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
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Export Transactions</Text>

        <Text style={screenStyles.subtitle}>
          Download your transaction history as a CSV file.
        </Text>
      </View>

      <View style={[screenStyles.card, { gap: 12 }]}>
        <Text style={screenStyles.sectionTitle}>What will be exported?</Text>

        <Text style={{ color: colors.textSecondary }}>• Date</Text>

        <Text style={{ color: colors.textSecondary }}>• Transaction Type</Text>

        <Text style={{ color: colors.textSecondary }}>• Category</Text>

        <Text style={{ color: colors.textSecondary }}>• Description</Text>

        <Text style={{ color: colors.textSecondary }}>• Amount</Text>
      </View>

      <Pressable
        onPress={handleExport}
        disabled={exporting}
        style={[screenStyles.primaryButton, { opacity: exporting ? 0.5 : 1 }]}
      >
        <Text style={screenStyles.primaryButtonText}>
          {exporting
            ? "Exporting..."
            : "Export Transactions as CSV"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
