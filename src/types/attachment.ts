export interface Attachment {
  id: string;
  transactionId: string;
  name: string;
  mimeType?: string;
  size?: number;
  uri: string;
  createdAt: string;
}
