import type { Transaction } from "../../types/transaction";

export interface TransactionRepository {
  getTransactions(accountId: string): Promise<Transaction[]>;

  getTransaction(id: string): Promise<Transaction | null>;

  createTransaction(transaction: Transaction): Promise<void>;

  updateTransaction(transaction: Transaction): Promise<void>;

  deleteTransaction(id: string): Promise<void>;
}