import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useIncomingShare } from "expo-sharing";

import type { Transaction } from "../../../types/transaction";

import { useAuthStore } from "../../../store/auth/authStore";
import { useCurrentAccount } from "../../accounts/hooks/useCurrentAccount";
import { getTransactions } from "../services/transactionService";
import {
  buildAttachment,
  createAttachment,
  deleteAttachmentFiles,
  formatFileSize,
} from "../services/attachmentService";
import { colors, radii, screenStyles } from "../../../theme";
import { generateId } from "../../../utils/id";

interface ReceivedFile {
  attachmentId: string;
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  isImage: boolean;
}

interface IncomingPayload {
  contentUri?: string | null;
  contentMimeType?: string | null;
  contentSize?: number | null;
  originalName?: string | null;
  shareType?: string | null;
}

// Kotlin's File.toURI() emits "file:/path" with a single slash;
// expo-file-system expects "file://".
function normalizeFileUri(uri: string) {
  if (uri.startsWith("file:/") && !uri.startsWith("file://")) {
    return uri.replace("file:/", "file://");
  }

  return uri;
}

function isFilePayload(payload: IncomingPayload) {
  return (
    !!payload.contentUri &&
    (payload.shareType === "file" ||
      payload.shareType === "image")
  );
}

export function ShareReceiverScreen() {
  const {
    resolvedSharedPayloads,
    isResolving,
    clearSharedPayloads,
  } = useIncomingShare();

  const user = useAuthStore((state) => state.user);

  const { currentAccountId } = useCurrentAccount();

  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [copying, setCopying] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(
    [],
  );
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const filesRef = useRef<ReceivedFile[]>([]);
  const processedKeyRef = useRef("");
  const attachedRef = useRef(false);

  const payloadsKey = resolvedSharedPayloads
    .filter(isFilePayload)
    .map((payload) => payload.contentUri)
    .join("|");

  // Copy shared files into app storage as soon as they arrive so
  // they survive even if the source app's temporary copy is cleared.
  useEffect(() => {
    if (!payloadsKey || processedKeyRef.current === payloadsKey) {
      return;
    }

    processedKeyRef.current = payloadsKey;

    const filePayloads = resolvedSharedPayloads.filter(isFilePayload);

    let cancelled = false;

    async function copyPayloads() {
      setCopying(true);

      await deleteAttachmentFiles(filesRef.current);
      filesRef.current = [];
      setFiles([]);

      const directory = FileSystem.documentDirectory;

      if (!directory) {
        console.error("SHARE RECEIVER: missing document directory");
        setCopying(false);
        return;
      }

      const targetDirectory = `${directory}attachments/`;

      try {
        await FileSystem.makeDirectoryAsync(targetDirectory, {
          intermediates: true,
        });
      } catch (error) {
        console.error("SHARE RECEIVER: failed to create directory");
      }

      const copied: ReceivedFile[] = [];

      for (let index = 0; index < filePayloads.length; index++) {
        const payload = filePayloads[index];

        if (!payload.contentUri) {
          continue;
        }

        const attachmentId = generateId();

        const rawName =
          payload.originalName ||
          `shared-file-${Date.now()}-${index}`;

        const name = rawName.replace(/[^\w.\-]+/g, "_");

        const uri = `${targetDirectory}${attachmentId}-${name}`;

        try {
          await FileSystem.copyAsync({
            from: normalizeFileUri(payload.contentUri),
            to: uri,
          });

          copied.push({
            attachmentId,
            uri,
            name: rawName,
            mimeType: payload.contentMimeType ?? null,
            size: payload.contentSize ?? null,
            isImage:
              payload.contentMimeType?.startsWith("image/") ??
              false,
          });
        } catch (error) {
          console.error("SHARE RECEIVER: failed to copy file");
        }
      }

      if (cancelled) {
        return;
      }

      filesRef.current = copied;
      setFiles(copied);
      setCopying(false);
    }

    copyPayloads();

    return () => {
      cancelled = true;
    };
  }, [payloadsKey]);

  // Discard copied files when leaving the screen without attaching.
  useEffect(() => {
    return () => {
      if (!attachedRef.current) {
        deleteAttachmentFiles(filesRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !currentAccountId || files.length === 0) {
      return;
    }

    getTransactions(currentAccountId)
      .then((rows) => {
        setTransactions(rows.slice(0, 30));
      })
      .catch((error) => {
        console.error("SHARE RECEIVER: failed to load transactions", error);
      });
  }, [user, currentAccountId, files.length]);

  async function handleAttach() {
    if (!selectedTransactionId || files.length === 0) {
      return;
    }

    try {
      setSaving(true);

      for (const file of files) {
        await createAttachment(
          buildAttachment({
            id: file.attachmentId,
            transactionId: selectedTransactionId,
            name: file.name,
            mimeType: file.mimeType ?? undefined,
            size: file.size ?? undefined,
            uri: file.uri,
          }),
        );
      }

      attachedRef.current = true;
      clearSharedPayloads();

      router.replace(`/transaction/${selectedTransactionId}`);
    } catch (error) {
      console.error("SHARE RECEIVER: failed to attach files", error);

      Alert.alert(
        "Could not save",
        "The shared file could not be attached. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    await deleteAttachmentFiles(filesRef.current);
    filesRef.current = [];
    setFiles([]);

    clearSharedPayloads();

    router.replace("/");
  }

  async function handleLoginFirst() {
    await deleteAttachmentFiles(filesRef.current);
    filesRef.current = [];
    setFiles([]);

    clearSharedPayloads();

    router.replace("/login");
  }

  const busy = isResolving || copying;

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Save as Receipt</Text>

        <Text style={screenStyles.subtitle}>
          Attach the shared file to a transaction so it stays
          with your records.
        </Text>
      </View>

      {busy ? (
        <View style={screenStyles.emptyState}>
          <ActivityIndicator />

          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
            }}
          >
            Receiving file...
          </Text>
        </View>
      ) : files.length === 0 ? (
        <View style={screenStyles.emptyState}>
          <Ionicons
            name="document-outline"
            size={28}
            color={colors.textMuted}
          />

          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
            }}
          >
            No file was received.
          </Text>

          <Pressable
            onPress={() => router.replace("/")}
            style={[
              screenStyles.primaryButton,
              { marginTop: 20, paddingHorizontal: 24 },
            ]}
          >
            <Text style={screenStyles.primaryButtonText}>
              Close
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[screenStyles.card, { gap: 14 }]}>
            {files.map((file) => (
              <View
                key={file.attachmentId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {file.isImage ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: radii.sm,
                    }}
                  />
                ) : (
                  <View style={screenStyles.iconCircle}>
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontWeight: "600", fontSize: 15 }}
                  >
                    {file.name}
                  </Text>

                  <Text
                    style={{
                      marginTop: 2,
                      color: colors.textSecondary,
                      fontSize: 13,
                    }}
                  >
                    {formatFileSize(file.size ?? undefined)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {!user ? (
            <View style={[screenStyles.card, { gap: 14 }]}>
              <Text style={{ color: colors.textSecondary }}>
                Log in to Denari first, then share the file again.
              </Text>

              <Pressable
                onPress={handleLoginFirst}
                style={screenStyles.primaryButton}
              >
                <Text style={screenStyles.primaryButtonText}>
                  Log In
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={screenStyles.sectionTitle}>
                Attach to a transaction
              </Text>

              {transactions.length === 0 ? (
                <View style={screenStyles.emptyState}>
                  <Text style={{ color: colors.textSecondary }}>
                    No transactions found in this account.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {transactions.map((transaction) => {
                    const selected =
                      transaction.id === selectedTransactionId;

                    return (
                      <Pressable
                        key={transaction.id}
                        onPress={() =>
                          setSelectedTransactionId(transaction.id)
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          backgroundColor: colors.surface,
                          borderRadius: radii.lg,
                          padding: 14,
                          borderWidth: 2,
                          borderColor: selected
                            ? colors.secondary
                            : colors.border,
                        }}
                      >
                        <View style={screenStyles.iconCircle}>
                          <Ionicons
                            name={
                              transaction.type === "expense"
                                ? "arrow-down"
                                : "arrow-up"
                            }
                            size={18}
                            color={colors.primary}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                          >
                            {transaction.description ||
                              transaction.category}
                          </Text>

                          <Text
                            style={{
                              marginTop: 2,
                              color: colors.textSecondary,
                              fontSize: 13,
                            }}
                          >
                            {transaction.category} ·{" "}
                            {new Date(
                              transaction.date,
                            ).toLocaleDateString()}
                          </Text>
                        </View>

                        <Text style={{ fontWeight: "700" }}>
                          {transaction.type === "expense"
                            ? "-"
                            : "+"}
                          {transaction.amount.toLocaleString()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable
                onPress={handleAttach}
                disabled={!selectedTransactionId || saving}
                style={[
                  screenStyles.primaryButton,
                  {
                    opacity:
                      !selectedTransactionId || saving ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={screenStyles.primaryButtonText}>
                  {saving
                    ? "Saving..."
                    : "Attach to Transaction"}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            onPress={handleDiscard}
            disabled={saving}
            style={[
              screenStyles.outlineButton,
              { opacity: saving ? 0.5 : 1 },
            ]}
          >
            <Text style={screenStyles.outlineButtonText}>
              Discard
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
