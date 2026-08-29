export interface Budget {
  id: string;
  accountId: string;
  month: string;
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
