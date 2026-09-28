import type { Budget } from "../types/budget";
import type { Transaction } from "../../../types/transaction";

import { getPreviousMonth } from "./monthUtils";

import { getBudget, getBudgetCategories } from "./budgetService";
import {
  calculateBudgetCategorySummaries,
  type BudgetCategorySummary,
} from "./budgetCalculationService";

import { getTransactions } from "../../transactions/services/transactionService";
import {
  calculateExpenses,
  calculateIncome,
} from "../../transactions/services/transactionCalculationService";

/**
 * Aggregated, deterministic view of one account's month.
 *
 * This is the single calculation layer shared by the Dai Coach context
 * builder and the Budget Report builder, so both features always derive
 * their numbers from the same math.
 */
export interface BudgetOverview {
  month: string;
  previousMonth: string;
  budget: Budget | null;
  categories: BudgetCategorySummary[];
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  utilisationPercent: number;
  incomeTotal: number;
  expensesTotal: number;
  previousMonthExpensesTotal: number;
  expenseChangePercent: number | null;
}

function filterByMonth(
  transactions: Transaction[],
  month: string,
): Transaction[] {
  return transactions.filter(
    (transaction) => transaction.date.slice(0, 7) === month,
  );
}

export async function buildBudgetOverview(
  accountId: string,
  month?: string,
): Promise<BudgetOverview> {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  const previousMonth = getPreviousMonth(targetMonth);

  const budget = await getBudget(accountId, targetMonth);
  const budgetCategories = budget
    ? await getBudgetCategories(budget.id)
    : [];

  const transactions = await getTransactions(accountId);

  const categories = calculateBudgetCategorySummaries(
    budgetCategories,
    transactions,
    targetMonth,
  );

  const monthTransactions = filterByMonth(transactions, targetMonth);
  const previousMonthTransactions = filterByMonth(transactions, previousMonth);

  const totalBudgeted = budget?.totalBudget ?? 0;

  const totalSpent = categories.reduce(
    (total, category) => total + category.spent,
    0,
  );

  const totalRemaining = categories.reduce(
    (total, category) => total + category.remaining,
    0,
  );

  const utilisationPercent =
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const expensesTotal = calculateExpenses(monthTransactions);
  const previousMonthExpensesTotal = calculateExpenses(
    previousMonthTransactions,
  );

  const expenseChangePercent =
    previousMonthExpensesTotal > 0
      ? ((expensesTotal - previousMonthExpensesTotal) /
          previousMonthExpensesTotal) *
        100
      : null;

  return {
    month: targetMonth,
    previousMonth,
    budget,
    categories,
    totalBudgeted,
    totalSpent,
    totalRemaining,
    utilisationPercent,
    incomeTotal: calculateIncome(monthTransactions),
    expensesTotal,
    previousMonthExpensesTotal,
    expenseChangePercent,
  };
}
