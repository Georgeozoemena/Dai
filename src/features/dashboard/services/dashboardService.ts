import { getTransactions } from "../../transactions/services/transactionService";

import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
} from "../../transactions/services/transactionCalculationService";

export async function getDashboardData(
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

  const recentTransactions =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 5);

  return {
    income,
    expenses,
    balance,
    recentTransactions,
  };
}