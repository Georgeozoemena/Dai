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
  console.log('[BudgetCalculation] ====== CALCULATION START ======');
  console.log('[BudgetCalculation] Period identifier:', month);
  console.log('[BudgetCalculation] Categories count:', categories.length);
  console.log('[BudgetCalculation] Transactions count:', transactions.length);
  
  // Debug: Show sample transaction dates
  if (transactions.length > 0) {
    console.log('[BudgetCalculation] Sample transaction dates:', 
      transactions.slice(0, 3).map(t => ({ date: t.date, type: t.type, category: t.category, amount: t.amount }))
    );
  }
  
  return categories.map((category) => {
    console.log(`[BudgetCalculation] Processing category: ${category.category}`);
    
    const spent = transactions
      .filter((transaction) => {
        if (transaction.type !== "expense") {
          return false;
        }
        if (transaction.category !== category.category) {
          return false;
        }
        
        // Match transactions based on budget period format
        const txDate = transaction.date;
        let matches = false;
        
        // Monthly format: "2024-10"
        if (month.match(/^\d{4}-\d{2}$/)) {
          matches = txDate.slice(0, 7) === month;
          console.log(`[BudgetCalculation]   Monthly check: ${txDate.slice(0, 7)} === ${month} ? ${matches}`);
        }
        // Daily format: "2024-10-09"
        else if (month.match(/^\d{4}-\d{2}-\d{2}$/)) {
          matches = txDate.slice(0, 10) === month;
          console.log(`[BudgetCalculation]   Daily check: ${txDate.slice(0, 10)} === ${month} ? ${matches}`);
        }
        // Weekly format: "2024-W42"
        else if (month.match(/^\d{4}-W\d+$/)) {
          const txWeek = getWeekIdentifier(new Date(txDate));
          matches = txWeek === month;
          console.log(`[BudgetCalculation]   Weekly check: ${txWeek} === ${month} ? ${matches}`);
        }
        // Yearly format: "2024"
        else if (month.match(/^\d{4}$/)) {
          matches = txDate.slice(0, 4) === month;
          console.log(`[BudgetCalculation]   Yearly check: ${txDate.slice(0, 4)} === ${month} ? ${matches}`);
        }
        // Fallback to monthly comparison
        else {
          matches = txDate.slice(0, 7) === month;
          console.log(`[BudgetCalculation]   Fallback monthly check: ${txDate.slice(0, 7)} === ${month} ? ${matches}`);
        }
        
        return matches;
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

    console.log(`[BudgetCalculation] ${category.category}: Budgeted=${category.amount}, Spent=${spent}, Remaining=${remaining}, ${percentage.toFixed(1)}%`);

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

/**
 * Get week identifier for a date (e.g., "2024-W42")
 */
function getWeekIdentifier(date: Date): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber}`;
}
