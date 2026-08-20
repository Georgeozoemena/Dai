import { getTransactions } from "./transactionService";

import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
} from "./transactionCalculationService";

export async function getAccountBalance(
  accountId: string,
) {
  const transactions =
    await getTransactions(accountId);

  const income =
    calculateIncome(transactions);

  const expenses =
    calculateExpenses(transactions);

  const balance =
    calculateBalance(transactions);

  return {
    income,
    expenses,
    balance,
  };
}