import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Transaction } from "../../../types/transaction";

import {
  getTransaction,
  updateTransaction,
} from "../services/transactionService";

interface EditTransactionScreenProps {
  transactionId: string;
  onBack?: () => void;
}

export function EditTransactionScreen({
  transactionId,
  onBack,
}: EditTransactionScreenProps) {
  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] =
    useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);

        const data =
          await getTransaction(
            transactionId,
          );

        if (!data) {
          return;
        }

        setTransaction(data);

        setAmount(
          String(data.amount),
        );

        setCategory(
          data.category,
        );

        setDescription(
          data.description ?? "",
        );

        setDate(data.date);
      } catch (error) {
        console.error(
          "FAILED TO LOAD TRANSACTION:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransaction();
  }, [transactionId]);

  const validateForm = () => {
    if (!amount) {
      return "Please enter an amount.";
    }

    const numericAmount =
      Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      return "Amount must be greater than 0.";
    }

    if (!category.trim()) {
      return "Please enter a category.";
    }

    return null;
  };

  const handleSave = async () => {
    if (!transaction) {
      return;
    }

    const error = validateForm();

    if (error) {
      console.log(
        "VALIDATION ERROR:",
        error,
      );

      return;
    }

    try {
      setSaving(true);

      const now =
        new Date().toISOString();

      const updatedTransaction: Transaction = {
        ...transaction,

        amount: Number(amount),

        category: category.trim(),

        description:
          description.trim() ||
          undefined,

        date,

        updatedAt: now,
      };

      await updateTransaction(
        updatedTransaction,
      );

      console.log(
        "TRANSACTION UPDATED:",
        updatedTransaction,
      );

      setTransaction(
        updatedTransaction,
      );

      router.back();
    } catch (error) {
      console.error(
        "FAILED TO UPDATE TRANSACTION:",
        error,
      );
    } finally {
      setSaving(false);
    }
  };

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
          Loading transaction...
        </Text>
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
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Edit Transaction
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
          Update your transaction details.
        </Text>
      </View>

      {/* Transaction type */}

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Text style={{ color: "#666" }}>
          Type
        </Text>

        <Text
          style={{
            marginTop: 4,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {transaction.type === "expense"
            ? "Expense"
            : "Income"}
        </Text>
      </View>

      {/* Amount */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Amount
        </Text>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Category */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Category
        </Text>

        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Category"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Description */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Description
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            minHeight: 100,
            textAlignVertical: "top",
          }}
        />
      </View>

      {/* Save */}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
          opacity: saving ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}