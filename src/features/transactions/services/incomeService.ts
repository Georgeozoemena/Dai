import type { Transaction } from "../../../types/transaction";
import { createTransaction } from "./transactionService";

interface CreateIncomeInput {
  accountId: string;
  amount: number;
  category: string;
  description?: string;
  note?: string;
  date: string;
}

export async function createIncome(input: CreateIncomeInput) {
  const now = new Date().toISOString();

  const transaction: Transaction = {
    id: crypto.randomUUID(),

    accountId: input.accountId,

    type: "income",

    amount: input.amount,

    category: input.category,

    description: input.description,

    note: input.note,

    date: input.date,

    createdAt: now,
    updatedAt: now,
  };

  await createTransaction(transaction);

  return transaction;
}
