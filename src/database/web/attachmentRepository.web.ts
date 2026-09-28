import type { AttachmentRepository } from "../repositories/attachmentRepository";

// Attachments are created by receiving files shared from other
// Android apps, which has no web equivalent. This placeholder keeps
// the shared repository interface intact for the web build.
export const attachmentRepository: AttachmentRepository = {
  async getAttachments() {
    return [];
  },

  async createAttachment() {},

  async deleteAttachment() {},
};
