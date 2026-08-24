import type { Transaction } from "../../../types/transaction";

import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
} from "../../transactions/services/transactionCalculationService";

export function calculateDashboardSummary(
  transactions: Transaction[],
) {
  const income = calculateIncome(
    transactions,
  );

  const expenses = calculateExpenses(
    transactions,
  );

  const balance = calculateBalance(
    transactions,
  );

  return {
    income,
    expenses,
    balance,
  };
}
