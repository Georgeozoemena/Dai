import type { Transaction } from "../../../types/transaction";

import type {
  FinanceCoachBudgetLine,
  FinanceCoachCategoryTotal,
  FinanceCoachContext,
  FinanceCoachTrendPoint,
} from "../types";

import { buildBudgetOverview } from "../../budget/services/budgetOverviewService";
import { BUDGET_WARNING_CONFIG } from "../../budget/services/budgetWarningService";
import { getSavingsGoals } from "../../savings-goals/services/savingsGoalService";
import { getTransactions } from "../../transactions/services/transactionService";

const TOP_SPENDING_CATEGORY_LIMIT = 5;

export function getMonthPeriod(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  // Day 0 of the next month is the last day of this month (UTC-safe).
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  const start = `${month}-01`;
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  let daysRemaining = 0;

  if (month === currentMonth) {
    daysRemaining = Math.max(lastDay - now.getDate(), 0);
  } else if (month > currentMonth) {
    daysRemaining = lastDay;
  }

  return { start, end, daysRemaining };
}

function buildWeeklyTrend(
  monthTransactions: Transaction[],
): FinanceCoachTrendPoint[] {
  // Split the month into 7-day buckets and total the spending in each.
  const weeklyTotals = [0, 0, 0, 0, 0];

  for (const transaction of monthTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const day = Number(transaction.date.slice(8, 10));

    if (!day || day < 1 || day > 31) {
      continue;
    }

    const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);

    weeklyTotals[weekIndex] += transaction.amount;
  }

  return weeklyTotals.map((total, index) => ({
    label: `Week ${index + 1}`,
    total,
  }));
}

function buildTopSpendingCategories(
  monthTransactions: Transaction[],
): FinanceCoachCategoryTotal[] {
  const totalsByCategory = new Map<string, number>();

  for (const transaction of monthTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const current = totalsByCategory.get(transaction.category) ?? 0;

    totalsByCategory.set(
      transaction.category,
      current + transaction.amount,
    );
  }

  return [...totalsByCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_SPENDING_CATEGORY_LIMIT);
}

/**
 * Build the structured financial context handed to the AI.
 *
 * Only derived, aggregated values leave the device — no transaction
 * records, no identifiers, no profile details, no receipt files.
 */
export async function buildFinanceCoachContext(
  accountId: string,
  currencyCode: string,
  month?: string,
): Promise<FinanceCoachContext> {
  const overview = await buildBudgetOverview(accountId, month);

  const [savingsGoals, transactions] = await Promise.all([
    getSavingsGoals(accountId),
    getTransactions(accountId),
  ]);

  const monthTransactions = transactions.filter(
    (transaction) => transaction.date.slice(0, 7) === overview.month,
  );

  const approachingThreshold =
    BUDGET_WARNING_CONFIG.approachingThresholdPercent;

  const budgets: FinanceCoachBudgetLine[] = overview.categories.map(
    (category) => ({
      category: category.category,
      limit: category.budgeted,
      spent: category.spent,
      remaining: category.remaining,
      usagePercent: category.percentage,
      status:
        category.remaining < 0
          ? "exceeded"
          : category.percentage >= approachingThreshold
            ? "approaching"
            : "on_track",
    }),
  );

  const savingsTarget = savingsGoals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );
  const savingsCurrent = savingsGoals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  );

  return {
    period: getMonthPeriod(overview.month),
    currency: currencyCode,
    income: {
      total: overview.incomeTotal,
    },
    expenses: {
      total: overview.expensesTotal,
      previousPeriodTotal: overview.previousMonthExpensesTotal,
      changePercent: overview.expenseChangePercent,
    },
    budgets,
    savings: {
      target: savingsTarget,
      current: savingsCurrent,
      progressPercent:
        savingsTarget > 0
          ? Math.min((savingsCurrent / savingsTarget) * 100, 100)
          : 0,
    },
    topSpendingCategories: buildTopSpendingCategories(monthTransactions),
    recentSpendingTrend: buildWeeklyTrend(monthTransactions),
  };
}
