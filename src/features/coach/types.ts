/**
 * Types for the Dai Coach feature.
 *
 * The AI never sees Dai's database — it only receives the aggregated,
 * derived context defined here, and returns structured advice which the
 * app renders. All numbers in the context are calculated by Dai itself.
 */

export interface FinanceCoachPeriod {
  /** First day of the period, "YYYY-MM-DD". */
  start: string;
  /** Last day of the period, "YYYY-MM-DD". */
  end: string;
  /** Days left in the period (0 once it has ended). */
  daysRemaining: number;
}

export type FinanceCoachBudgetStatus = "on_track" | "approaching" | "exceeded";

export interface FinanceCoachBudgetLine {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: FinanceCoachBudgetStatus;
}

export interface FinanceCoachCategoryTotal {
  category: string;
  total: number;
}

export interface FinanceCoachTrendPoint {
  label: string;
  total: number;
}

export interface FinanceCoachContext {
  period: FinanceCoachPeriod;
  currency: string;
  income: {
    total: number;
  };
  expenses: {
    total: number;
    previousPeriodTotal: number;
    changePercent: number | null;
  };
  budgets: FinanceCoachBudgetLine[];
  savings: {
    target: number;
    current: number;
    progressPercent: number;
  };
  topSpendingCategories: FinanceCoachCategoryTotal[];
  recentSpendingTrend: FinanceCoachTrendPoint[];
}

export interface FinanceCoachAdvice {
  whatWentWell: string[];
  needsAttention: string[];
  suggestions: string[];
}

export interface FinanceCoachResponse {
  advice: FinanceCoachAdvice;
  generatedAt: string;
  provider: string;
}
