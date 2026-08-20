export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}