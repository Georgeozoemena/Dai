import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Attachment } from "../../../types/attachment";
import type { Transaction } from "../../../types/transaction";

import {
  getTransaction,
  deleteTransaction,
} from "../services/transactionService";
import {
  deleteAttachmentFiles,
  formatFileSize,
  getTransactionAttachments,
  isImageAttachment,
  openAttachment,
  removeAttachment,
} from "../services/attachmentService";
import { colors, radii, screenStyles } from "../../../theme";
import { PageBackButton } from "../../../components/PageBackButton";

function confirmDialog(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(
      typeof window !== "undefined" &&
        window.confirm(message),
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: confirmLabel,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

interface TransactionDetailScreenProps {
  transactionId: string;
  onBack?: () => void;
}

export function TransactionDetailScreen({
  transactionId,
  onBack,
}: TransactionDetailScreenProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);

        const [data, attachmentRows] = await Promise.all([
          getTransaction(transactionId),
          getTransactionAttachments(transactionId),
        ]);

        setTransaction(data);
        setAttachments(attachmentRows);
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

      await deleteAttachmentFiles(attachments);

      console.log("TRANSACTION DELETED:", transaction.id);

      router.back();
    } catch (error) {
      console.error("FAILED TO DELETE TRANSACTION:", error);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = async () => {
    if (!transaction) {
      return;
    }

    const confirmed = await confirmDialog(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      "Delete",
    );

    if (confirmed) {
      handleDelete();
    }
  };

  const handleOpenAttachment = async (attachment: Attachment) => {
    try {
      await openAttachment(attachment);
    } catch (error) {
      console.error("FAILED TO OPEN ATTACHMENT:", error);

      const message = "This file could not be opened.";

      if (Platform.OS === "web") {
        window.alert(message);
        return;
      }

      Alert.alert("Could not open file", message);
    }
  };

  const removeAttachmentFromList = async (attachment: Attachment) => {
    try {
      await removeAttachment(attachment);

      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
    } catch (error) {
      console.error("FAILED TO REMOVE ATTACHMENT:", error);
    }
  };

  const confirmRemoveAttachment = async (attachment: Attachment) => {
    const confirmed = await confirmDialog(
      "Remove Attachment",
      `Remove "${attachment.name}" from this transaction?`,
      "Remove",
    );

    if (confirmed) {
      removeAttachmentFromList(attachment);
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <PageBackButton onPress={onBack ?? (() => router.back())} />

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

      {attachments.length > 0 && (
        <View style={[screenStyles.card, { gap: 14 }]}>
          <Text style={screenStyles.sectionTitle}>Attachments</Text>

          {attachments.map((attachment) => (
            <Pressable
              key={attachment.id}
              onPress={() => handleOpenAttachment(attachment)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              {isImageAttachment(attachment) ? (
                <Image
                  source={{ uri: attachment.uri }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.sm,
                  }}
                />
              ) : (
                <View style={screenStyles.iconCircle}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: "600", fontSize: 15 }}
                >
                  {attachment.name}
                </Text>

                <Text
                  style={{
                    marginTop: 2,
                    color: colors.textSecondary,
                    fontSize: 13,
                  }}
                >
                  {formatFileSize(attachment.size)}
                </Text>
              </View>

              <Pressable
                onPress={() => confirmRemoveAttachment(attachment)}
                hitSlop={8}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.error}
                />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

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
