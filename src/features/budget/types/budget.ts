export interface Budget {
  id: string;
  accountId: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  month: string; // For monthly/yearly: "2026-10", for weekly: week number, for daily: date
  totalIncome: number;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}
