import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Transaction } from "../../../types/transaction";

import {
  getTransaction,
  deleteTransaction,
} from "../services/transactionService";
import { colors, radii, screenStyles } from "../../../theme";

interface TransactionDetailScreenProps {
  transactionId: string;
  onBack?: () => void;
}

export function TransactionDetailScreen({
  transactionId,
  onBack,
}: TransactionDetailScreenProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);

        const data = await getTransaction(transactionId);

        setTransaction(data);
      } catch (error) {
        console.error("FAILED TO LOAD TRANSACTION:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransaction();
  }, [transactionId]);

  if (loading) {
    return (
      <View style={screenStyles.centered}>
        <ActivityIndicator />

        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading transaction...
        </Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.sectionTitle}>Transaction not found</Text>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={[screenStyles.primaryButton, { marginTop: 20, paddingHorizontal: 20 }]}
          >
            <Text style={screenStyles.primaryButtonText}>Go Back</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const isExpense = transaction.type === "expense";

  const handleDelete = async () => {
    if (!transaction) {
      return;
    }

    try {
      setDeleting(true);

      await deleteTransaction(transaction.id);

      console.log("TRANSACTION DELETED:", transaction.id);

      router.back();
    } catch (error) {
      console.error("FAILED TO DELETE TRANSACTION:", error);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!transaction) {
      return;
    }

    // Use native browser confirm for web compatibility
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction? This action cannot be undone.",
    );

    if (confirmed) {
      handleDelete();
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {onBack && (
        <Pressable onPress={onBack}>
          <Text style={[screenStyles.label, { fontWeight: "600" }]}>← Back</Text>
        </Pressable>
      )}

      <View
        style={{
          backgroundColor: colors.secondary,
          borderRadius: radii.xl,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.primary,
            fontWeight: "600",
          }}
        >
          {isExpense ? "Expense" : "Income"}
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 32,
            fontWeight: "700",
            color: colors.primary,
          }}
        >
          {isExpense ? "-" : "+"}
          {transaction.amount.toLocaleString()}
        </Text>
      </View>

      <View style={[screenStyles.card, { gap: 16 }]}>
        <View>
          <Text style={{ color: colors.textSecondary }}>Category</Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {transaction.category}
          </Text>
        </View>

        <View>
          <Text style={{ color: colors.textSecondary }}>Description</Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 16,
            }}
          >
            {transaction.description || "No description"}
          </Text>
        </View>

        <View>
          <Text style={{ color: colors.textSecondary }}>Date</Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 16,
            }}
          >
            {new Date(transaction.date).toLocaleDateString()}
          </Text>
        </View>

        <View>
          <Text style={{ color: colors.textSecondary }}>Type</Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 16,
            }}
          >
            {transaction.type}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(`/transaction/${transactionId}/edit`)}
        style={[screenStyles.primaryButton, { flexDirection: "row", justifyContent: "center", gap: 8 }]}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={screenStyles.primaryButtonText}>Edit Transaction</Text>
      </Pressable>

      <Pressable
        onPress={confirmDelete}
        disabled={deleting}
        style={[
          screenStyles.outlineButton,
          {
            borderColor: colors.error,
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: deleting ? 0.5 : 1,
          },
        ]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
        <Text
          style={{
            color: colors.error,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {deleting ? "Deleting..." : "Delete Transaction"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
