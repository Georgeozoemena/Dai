import type { BudgetCategory } from "../types/budget";
import type { Transaction } from "../../../types/transaction";

import { calculateBudgetCategorySummaries } from "./budgetCalculationService";

/**
 * Configurable thresholds for the budget warning system.
 *
 * These exist so warning behaviour is defined in one place instead of
 * being scattered as magic numbers across components.
 */
export const BUDGET_WARNING_CONFIG = {
  /**
   * A projected spend at or above this percentage of the category limit
   * (while still under the limit) counts as "approaching budget".
   */
  approachingThresholdPercent: 80,
};

export type BudgetWarningLevel =
  | "approaching"
  | "will_exceed"
  | "already_exceeded";

export interface ProposedExpense {
  category: string;
  amount: number;
}

export interface BudgetWarning {
  level: BudgetWarningLevel;
  category: string;
  month: string;
  /** The category's budget limit for the month. */
  limit: number;
  /** Category spend before this expense. */
  spent: number;
  /** The expense being added. */
  proposedAmount: number;
  /** spent + proposedAmount. */
  projectedSpent: number;
  /** projectedSpent as a percentage of the limit. */
  projectedPercent: number;
  /** limit - spent (before this expense; negative when already over). */
  remaining: number;
  /** How far over the limit the category already is (0 when under). */
  currentOverBy: number;
  /** How far over the limit the category will be (0 when still under). */
  overBy: number;
}

/**
 * Evaluate pending expenses against the month's budget categories.
 *
 * Deterministic by design — no AI, no network. Category matching follows
 * the same rule as calculateBudgetCategorySummaries: an expense belongs to
 * a budget only when its category name matches exactly and its date falls
 * in the budget month.
 *
 * When several expenses are evaluated in one batch, each accepted expense
 * counts towards the projection of the ones after it.
 */
export function evaluateExpenseBudgetWarnings(
  budgetCategories: BudgetCategory[],
  transactions: Transaction[],
  month: string,
  proposedExpenses: ProposedExpense[],
): BudgetWarning[] {
  if (budgetCategories.length === 0 || proposedExpenses.length === 0) {
    return [];
  }

  const summaries = calculateBudgetCategorySummaries(
    budgetCategories,
    transactions,
    month,
  );

  const spendingByCategory = new Map<string, number>();

  for (const summary of summaries) {
    spendingByCategory.set(summary.category, summary.spent);
  }

  const warnings: BudgetWarning[] = [];

  for (const expense of proposedExpenses) {
    if (expense.amount <= 0) {
      continue;
    }

    const budgetCategory = budgetCategories.find(
      (category) => category.category === expense.category,
    );

    // The category is not budgeted (or has no usable limit) — nothing to warn about.
    if (!budgetCategory || budgetCategory.amount <= 0) {
      continue;
    }

    const limit = budgetCategory.amount;
    const spent = spendingByCategory.get(expense.category) ?? 0;
    const projectedSpent = spent + expense.amount;
    const projectedPercent = (projectedSpent / limit) * 100;

    let level: BudgetWarningLevel | null = null;

    if (spent > limit) {
      level = "already_exceeded";
    } else if (projectedSpent > limit) {
      level = "will_exceed";
    } else if (
      projectedPercent >= BUDGET_WARNING_CONFIG.approachingThresholdPercent
    ) {
      level = "approaching";
    }

    if (level) {
      warnings.push({
        level,
        category: expense.category,
        month,
        limit,
        spent,
        proposedAmount: expense.amount,
        projectedSpent,
        projectedPercent,
        remaining: limit - spent,
        currentOverBy: Math.max(spent - limit, 0),
        overBy: Math.max(projectedSpent - limit, 0),
      });
    }

    // This expense counts towards the projection of later expenses.
    spendingByCategory.set(expense.category, projectedSpent);
  }

  return warnings;
}
