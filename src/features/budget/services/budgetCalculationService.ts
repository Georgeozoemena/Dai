import type {
  BudgetCategory,
} from "../types/budget";

import type {
  Transaction,
} from "../../../types/transaction";

export interface BudgetCategorySummary {
  categoryId: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "healthy" | "warning" | "exceeded";
}

export function calculateBudgetCategorySummaries(
  categories: BudgetCategory[],
  transactions: Transaction[],
  month: string,
): BudgetCategorySummary[] {
  return categories.map((category) => {
    const spent = transactions
      .filter((transaction) => {
        return (
          transaction.type === "expense" &&
          transaction.category ===
            category.category &&
          transaction.date.slice(0, 7) === month
        );
      })
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0,
      );

    const remaining =
      category.amount - spent;

    const percentage =
      category.amount > 0
        ? (spent / category.amount) * 100
        : 0;

    let status:
      | "healthy"
      | "warning"
      | "exceeded" = "healthy";

    if (percentage >= 100) {
      status = "exceeded";
    } else if (percentage >= 75) {
      status = "warning";
    }

    return {
      categoryId: category.id,
      category: category.category,
      budgeted: category.amount,
      spent,
      remaining,
      percentage,
      status,
    };
  });
}
