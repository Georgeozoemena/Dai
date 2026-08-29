import type {
  Budget,
  BudgetCategory,
} from "../../features/budget/types/budget";

export interface BudgetRepository {
  getBudget(
    accountId: string,
    month: string,
  ): Promise<Budget | null>;

  getBudgetCategories(
    budgetId: string,
  ): Promise<BudgetCategory[]>;

  createBudget(
    budget: Budget,
  ): Promise<void>;

  createBudgetCategory(
    category: BudgetCategory,
  ): Promise<void>;

  updateBudget(
    budget: Budget,
  ): Promise<void>;

  updateBudgetCategory(
    category: BudgetCategory,
  ): Promise<void>;

  deleteBudget(
    budgetId: string,
  ): Promise<void>;
}
