import type { Transaction } from "../../../types/transaction";

import { buildBudgetOverview } from "../../budget/services/budgetOverviewService";
import { formatMonthLabel } from "../../budget/services/monthUtils";
import { BUDGET_WARNING_CONFIG } from "../../budget/services/budgetWarningService";
import { buildDeterministicInsights } from "../../coach/services/deterministicInsights";
import { getSavingsGoals } from "../../savings-goals/services/savingsGoalService";
import { getTransactions } from "../../transactions/services/transactionService";

export type BudgetReportStatus = "on_track" | "approaching" | "exceeded";

export interface BudgetReportCategory {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: BudgetReportStatus;
}

export interface BudgetReportSpendingLine {
  category: string;
  total: number;
}

export interface BudgetReport {
  accountName: string;
  currency: string;
  month: string;
  monthLabel: string;
  previousMonthLabel: string;
  generatedAt: string;
  overview: {
    incomeTotal: number;
    expensesTotal: number;
    totalBudgeted: number;
    utilisationPercent: number;
    totalRemaining: number;
  };
  categories: BudgetReportCategory[];
  spendingByCategory: BudgetReportSpendingLine[];
  savings: {
    target: number;
    current: number;
    progressPercent: number;
  };
  highlights: {
    budgetsWithinTarget: number;
    budgetsApproaching: number;
    budgetsExceeded: number;
    largestCategory: BudgetReportSpendingLine | null;
    expenseChangePercent: number | null;
  };
  /**
   * Deterministic observations from Dai's own data. Used as the financial
   * review fallback when AI commentary is unavailable.
   */
  observations: string[];
}

/** The most recent n months as "YYYY-MM" strings, newest first. */
export function getRecentMonths(count: number = 6): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    months.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  return months;
}

function buildSpendingByCategory(
  monthTransactions: Transaction[],
): BudgetReportSpendingLine[] {
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
    .sort((a, b) => b.total - a.total);
}

export async function buildBudgetReport(params: {
  accountId: string;
  accountName: string;
  currencyCode: string;
  month?: string;
}): Promise<BudgetReport> {
  const { accountId, accountName, currencyCode, month } = params;

  const overview = await buildBudgetOverview(accountId, month);

  const [savingsGoals, transactions] = await Promise.all([
    getSavingsGoals(accountId),
    getTransactions(accountId),
  ]);

  const approachingThreshold =
    BUDGET_WARNING_CONFIG.approachingThresholdPercent;

  const categories: BudgetReportCategory[] = overview.categories.map(
    (category) => ({
      category: category.category,
      allocated: category.budgeted,
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

  const monthTransactions = transactions.filter(
    (transaction) => transaction.date.slice(0, 7) === overview.month,
  );

  const spendingByCategory = buildSpendingByCategory(monthTransactions);

  const savingsTarget = savingsGoals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );
  const savingsCurrent = savingsGoals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  );

  const insights = buildDeterministicInsights({
    overview,
    savingsGoals,
    currencyCode,
  });

  return {
    accountName,
    currency: currencyCode,
    month: overview.month,
    monthLabel: formatMonthLabel(overview.month),
    previousMonthLabel: formatMonthLabel(overview.previousMonth),
    generatedAt: new Date().toISOString(),
    overview: {
      incomeTotal: overview.incomeTotal,
      expensesTotal: overview.expensesTotal,
      totalBudgeted: overview.totalBudgeted,
      utilisationPercent: overview.utilisationPercent,
      totalRemaining: overview.totalRemaining,
    },
    categories,
    spendingByCategory,
    savings: {
      target: savingsTarget,
      current: savingsCurrent,
      progressPercent:
        savingsTarget > 0
          ? Math.min((savingsCurrent / savingsTarget) * 100, 100)
          : 0,
    },
    highlights: {
      budgetsWithinTarget: categories.filter(
        (category) => category.status === "on_track",
      ).length,
      budgetsApproaching: categories.filter(
        (category) => category.status === "approaching",
      ).length,
      budgetsExceeded: categories.filter(
        (category) => category.status === "exceeded",
      ).length,
      largestCategory: spendingByCategory[0] ?? null,
      expenseChangePercent: overview.expenseChangePercent,
    },
    observations: insights.slice(0, 6).map((insight) => insight.message),
  };
}
