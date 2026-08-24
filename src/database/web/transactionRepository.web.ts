import type { Transaction } from "../../types/transaction";
import type { TransactionRepository } from "../repositories/transactionRepository";
import { getDatabase } from "./database";

export const transactionRepository: TransactionRepository = {
  async getTransactions(accountId) {
    const db = await getDatabase();

    const transactions = await db.getAllFromIndex(
      "transactions",
      "accountId",
      accountId,
    );

    return transactions as Transaction[];
  },

  async getTransaction(id) {
    const db = await getDatabase();

    const transaction = await db.get("transactions", id);

    return (transaction as Transaction | undefined) ?? null;
  },

  async createTransaction(transaction) {
    const db = await getDatabase();

    await db.put("transactions", transaction);
  },

  async updateTransaction(transaction) {
    const db = await getDatabase();

    await db.put("transactions", transaction);
  },

  async deleteTransaction(id) {
    const db = await getDatabase();

    await db.delete("transactions", id);
  },
};
