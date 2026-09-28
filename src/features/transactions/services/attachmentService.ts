import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { Attachment } from "../../../types/attachment";
import { attachmentRepository } from "../../../database/attachment";
import { generateId } from "../../../utils/id";

interface BuildAttachmentInput {
  id?: string;
  transactionId: string;
  name: string;
  mimeType?: string;
  size?: number;
  uri: string;
}

// Matches the id/date conventions used by the other transaction services.
export function buildAttachment(
  input: BuildAttachmentInput,
): Attachment {
  return {
    id: input.id ?? generateId(),
    transactionId: input.transactionId,
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
    uri: input.uri,
    createdAt: new Date().toISOString(),
  };
}

export async function getTransactionAttachments(
  transactionId: string,
) {
  return attachmentRepository.getAttachments(transactionId);
}

export async function createAttachment(
  attachment: Attachment,
) {
  await attachmentRepository.createAttachment(attachment);

  return attachment;
}

// Deletes the database record and the stored file.
export async function removeAttachment(
  attachment: Attachment,
) {
  await attachmentRepository.deleteAttachment(attachment.id);
  await deleteAttachmentFile(attachment.uri);
}

// Best-effort file cleanup used when a transaction (and its
// cascaded attachment rows) are deleted.
export async function deleteAttachmentFiles(
  attachments: { uri: string }[],
) {
  for (const attachment of attachments) {
    await deleteAttachmentFile(attachment.uri);
  }
}

async function deleteAttachmentFile(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error("FAILED TO DELETE ATTACHMENT FILE:", error);
  }
}

// Opens the stored file in another app (viewer/share sheet).
export async function openAttachment(
  attachment: Attachment,
) {
  const info = await FileSystem.getInfoAsync(attachment.uri);

  if (!info.exists) {
    throw new Error("The file is no longer stored on this device");
  }

  await Sharing.shareAsync(attachment.uri, {
    mimeType: attachment.mimeType || "application/octet-stream",
    dialogTitle: attachment.name,
  });
}

export function isImageAttachment(
  attachment: Attachment,
) {
  return attachment.mimeType?.startsWith("image/") ?? false;
}

export function formatFileSize(size?: number) {
  if (!size || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
