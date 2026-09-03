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
import { colors, screenStyles } from "../../../theme";

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

      <View>
        <Text style={screenStyles.title}>Edit Transaction</Text>

        <Text style={screenStyles.subtitle}>
          Update your transaction details.
        </Text>
      </View>

      {/* Transaction type */}

      <View style={screenStyles.card}>
        <Text style={{ color: colors.textSecondary }}>Type</Text>

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
        <Text style={screenStyles.label}>Amount</Text>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={screenStyles.input}
        />
      </View>

      {/* Category */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Category</Text>

        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Category"
          style={screenStyles.input}
        />
      </View>

      {/* Description */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Description</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          multiline
          style={[screenStyles.input, screenStyles.inputMultiline]}
        />
      </View>

      {/* Save */}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
      >
        <Text style={screenStyles.primaryButtonText}>
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}