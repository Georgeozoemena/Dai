import type { SavingsGoal } from "../../../types/savingsGoal";

import type { BudgetOverview } from "../../budget/services/budgetOverviewService";

import { formatMonthLabel } from "../../budget/services/monthUtils";
import { BUDGET_WARNING_CONFIG } from "../../budget/services/budgetWarningService";
import { formatCurrency } from "../../../utils/currency";

export type InsightTone = "positive" | "attention" | "neutral";

export interface DeterministicInsight {
  id: string;
  tone: InsightTone;
  message: string;
}

export interface DeterministicInsightsInput {
  overview: BudgetOverview;
  savingsGoals: SavingsGoal[];
  currencyCode: string;
}

/**
 * Build non-AI insights straight from Dai's own numbers.
 *
 * These keep the Coach experience useful with no internet connection, and
 * double as the deterministic "financial observations" fallback when AI
 * commentary is unavailable.
 */
export function buildDeterministicInsights({
  overview,
  savingsGoals,
  currencyCode,
}: DeterministicInsightsInput): DeterministicInsight[] {
  const insights: DeterministicInsight[] = [];
  const format = (value: number) => formatCurrency(value, currencyCode);

  const { categories, month } = overview;
  const approachingThreshold =
    BUDGET_WARNING_CONFIG.approachingThresholdPercent;

  // Budget health
  if (categories.length === 0) {
    insights.push({
      id: "no-budget",
      tone: "neutral",
      message: `There's no budget set for ${formatMonthLabel(month)} yet. Budget health insights will appear once one is in place.`,
    });
  } else {
    for (const category of categories) {
      if (category.remaining < 0) {
        insights.push({
          id: `over-${category.categoryId}`,
          tone: "attention",
          message: `${category.category} is ${format(
            Math.abs(category.remaining),
          )} above budget.`,
        });
      } else if (category.percentage >= approachingThreshold) {
        insights.push({
          id: `approaching-${category.categoryId}`,
          tone: "attention",
          message: `You've used ${Math.round(category.percentage)}% of your ${
            category.category
          } budget.`,
        });
      }
    }

    const onTrackCount = categories.filter(
      (category) =>
        category.remaining >= 0 && category.percentage < approachingThreshold,
    ).length;

    if (onTrackCount > 0) {
      insights.push({
        id: "on-track-count",
        tone: "positive",
        message: `${onTrackCount} ${
          onTrackCount === 1 ? "budget is" : "budgets are"
        } still within target.`,
      });
    }
  }

  // Spending trend vs the previous month
  if (overview.expensesTotal > 0 && overview.expenseChangePercent !== null) {
    const change = Math.round(Math.abs(overview.expenseChangePercent));
    const previousLabel = formatMonthLabel(overview.previousMonth);

    if (overview.expenseChangePercent <= -10) {
      insights.push({
        id: "spend-down",
        tone: "positive",
        message: `Your spending is ${change}% lower than ${previousLabel}.`,
      });
    } else if (overview.expenseChangePercent >= 10) {
      insights.push({
        id: "spend-up",
        tone: "attention",
        message: `Your spending is ${change}% higher than ${previousLabel}.`,
      });
    } else {
      insights.push({
        id: "spend-stable",
        tone: "neutral",
        message: `Your spending is roughly in line with ${previousLabel}.`,
      });
    }
  }

  // Largest spending category (skipped when it is already flagged over budget)
  const topCategory = [...categories].sort(
    (a, b) => b.spent - a.spent,
  )[0];

  if (topCategory && topCategory.spent > 0 && topCategory.remaining >= 0) {
    insights.push({
      id: "top-category",
      tone: "neutral",
      message: `${topCategory.category} is your largest spending category this month at ${format(
        topCategory.spent,
      )}.`,
    });
  }

  // Savings progress
  const totalTarget = savingsGoals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );
  const totalSaved = savingsGoals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  );

  if (totalTarget > 0) {
    const progressPercent = Math.min(
      (totalSaved / totalTarget) * 100,
      100,
    );

    insights.push({
      id: "savings-progress",
      tone: progressPercent >= 100 ? "positive" : "neutral",
      message:
        progressPercent >= 100
          ? `You've saved ${format(totalSaved)} across your goals — that's your full ${format(totalTarget)} target.`
          : `You've saved ${format(totalSaved)} of ${format(
              totalTarget,
            )} across your goals (${Math.round(progressPercent)}% progress).`,
    });
  }

  // Net position for the month
  if (overview.incomeTotal > 0) {
    const net = overview.incomeTotal - overview.expensesTotal;
    const expenseRatio = overview.expensesTotal / overview.incomeTotal;

    // Warning: expenses are 75-100% of income
    if (expenseRatio >= 0.75 && net >= 0) {
      insights.push({
        id: "net-position",
        tone: "attention",
        message: `Warning: You're ${format(net)} in the positive this month: income of ${format(
          overview.incomeTotal,
        )} against ${format(overview.expensesTotal)} of spending. You're close to your limit!`,
      });
    } else {
      insights.push({
        id: "net-position",
        tone: net >= 0 ? "positive" : "attention",
        message:
          net >= 0
            ? `You're ${format(net)} in the positive this month: income of ${format(
                overview.incomeTotal,
              )} against ${format(overview.expensesTotal)} of spending.`
            : `Spending is ${format(
                Math.abs(net),
              )} more than your income of ${format(overview.incomeTotal)} this month.`,
      });
    }
  }

  if (overview.expensesTotal === 0) {
    insights.push({
      id: "no-spending",
      tone: "neutral",
      message: `No spending has been recorded for ${formatMonthLabel(
        month,
      )} yet.`,
    });
  }

  return insights;
}
