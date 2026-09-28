import type { Transaction } from "../../../types/transaction";
import { generateId } from "../../../utils/id";
import { createTransaction } from "./transactionService";
import { trackEvent } from "../../../services/analytics/analyticsService";

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
    id: generateId(),

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

  trackEvent("income_created");

  return transaction;
}
