import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Transaction } from "../../../types/transaction";

import {
  getTransaction,
  deleteTransaction,
} from "../services/transactionService";

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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />

        <Text style={{ marginTop: 12 }}>Loading transaction...</Text>
      </View>
    );
  }

  if (!transaction) {
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
          Transaction not found
        </Text>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: "#111",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Go Back
            </Text>
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

      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error("FAILED TO DELETE TRANSACTION:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      {onBack && (
        <Pressable onPress={onBack}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            ← Back
          </Text>
        </Pressable>
      )}

      <View>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
          }}
        >
          {isExpense ? "Expense" : "Income"}
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          {isExpense ? "-" : "+"}
          {transaction.amount.toLocaleString()}
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 16,
          padding: 20,
          gap: 16,
        }}
      >
        <View>
          <Text style={{ color: "#666" }}>Category</Text>

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
          <Text style={{ color: "#666" }}>Description</Text>

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
          <Text style={{ color: "#666" }}>Date</Text>

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
          <Text style={{ color: "#666" }}>Type</Text>

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
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          backgroundColor: "#111",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Edit Transaction
        </Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        disabled={deleting}
        style={{
          paddingVertical: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#d00",
          alignItems: "center",
          opacity: deleting ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#d00",
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
