import type { Transaction } from "../../../types/transaction";

import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
} from "../../transactions/services/transactionCalculationService";

export function calculateDashboardSummary(
  transactions: Transaction[],
  initialBalance: number = 0,
) {
  const income = calculateIncome(
    transactions,
  );

  const expenses = calculateExpenses(
    transactions,
  );

  const balance = calculateBalance(
    transactions,
    initialBalance,
  );

  return {
    income,
    expenses,
    balance,
  };
}
