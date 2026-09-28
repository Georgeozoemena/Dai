import type { Attachment } from "../../types/attachment";
import type { AttachmentRepository } from "../repositories/attachmentRepository";
import { getDatabase } from "../client/database";

interface AttachmentRow {
  id: string;
  transaction_id: string;
  name: string;
  mime_type: string | null;
  size: number | null;
  uri: string;
  created_at: string;
}

function toAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    name: row.name,
    mimeType: row.mime_type ?? undefined,
    size: row.size ?? undefined,
    uri: row.uri,
    createdAt: row.created_at,
  };
}

export const attachmentRepository: AttachmentRepository = {
  async getAttachments(transactionId) {
    const db = getDatabase();

    const rows = db.getAllSync<AttachmentRow>(
      `SELECT * FROM attachments
       WHERE transaction_id = ?
       ORDER BY created_at ASC, id ASC`,
      transactionId,
    );

    return rows.map(toAttachment);
  },

  async createAttachment(attachment) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO attachments
        (id, transaction_id, name, mime_type, size, uri, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         transaction_id = excluded.transaction_id,
         name = excluded.name,
         mime_type = excluded.mime_type,
         size = excluded.size,
         uri = excluded.uri,
         created_at = excluded.created_at`,
      attachment.id,
      attachment.transactionId,
      attachment.name,
      attachment.mimeType ?? null,
      attachment.size ?? null,
      attachment.uri,
      attachment.createdAt,
    );
  },

  async deleteAttachment(id) {
    const db = getDatabase();

    db.runSync(`DELETE FROM attachments WHERE id = ?`, id);
  },
};
