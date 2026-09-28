import type { Attachment } from "../../types/attachment";

export interface AttachmentRepository {
  getAttachments(transactionId: string): Promise<Attachment[]>;
  createAttachment(attachment: Attachment): Promise<void>;
  deleteAttachment(id: string): Promise<void>;
}
