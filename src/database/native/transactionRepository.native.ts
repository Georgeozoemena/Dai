import type { Transaction } from "../../types/transaction";
import type { TransactionRepository } from "../repositories/transactionRepository";
import { getDatabase } from "../client/database";

type TransactionRow = {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type as Transaction["type"],
    amount: row.amount,
    category: row.category,
    description: row.description ?? undefined,
    note: row.note ?? undefined,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const transactionRepository: TransactionRepository = {
  async getTransactions(accountId) {
    const db = getDatabase();

    const rows = db.getAllSync<TransactionRow>(
      `SELECT * FROM transactions
       WHERE account_id = ?
       ORDER BY date DESC, created_at DESC`,
      accountId,
    );

    return rows.map(toTransaction);
  },

  async getTransaction(id) {
    const db = getDatabase();

    const row = db.getFirstSync<TransactionRow>(
      "SELECT * FROM transactions WHERE id = ?",
      id,
    );

    return row ? toTransaction(row) : null;
  },

  async createTransaction(transaction) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO transactions
        (id, account_id, type, amount, category, description, note, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         type = excluded.type,
         amount = excluded.amount,
         category = excluded.category,
         description = excluded.description,
         note = excluded.note,
         date = excluded.date,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      transaction.id,
      transaction.accountId,
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.description ?? null,
      transaction.note ?? null,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
    );
  },

  async updateTransaction(transaction) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO transactions
        (id, account_id, type, amount, category, description, note, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         type = excluded.type,
         amount = excluded.amount,
         category = excluded.category,
         description = excluded.description,
         note = excluded.note,
         date = excluded.date,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      transaction.id,
      transaction.accountId,
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.description ?? null,
      transaction.note ?? null,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
    );
  },

  async deleteTransaction(id) {
    const db = getDatabase();

    db.runSync("DELETE FROM transactions WHERE id = ?", id);
  },
};
