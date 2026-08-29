import type {
  Budget,
  BudgetCategory,
} from "../../features/budget/types/budget";

import type { BudgetRepository } from "../repositories/budgetRepository";

export const budgetRepository: BudgetRepository = {
  async getBudget(
    accountId: string,
    month: string,
  ): Promise<Budget | null> {
    throw new Error("Not implemented");
  },

  async getBudgetCategories(
    budgetId: string,
  ): Promise<BudgetCategory[]> {
    throw new Error("Not implemented");
  },

  async createBudget(
    budget: Budget,
  ): Promise<void> {
    throw new Error("Not implemented");
  },

  async createBudgetCategory(
    category: BudgetCategory,
  ): Promise<void> {
    throw new Error("Not implemented");
  },

  async updateBudget(
    budget: Budget,
  ): Promise<void> {
    throw new Error("Not implemented");
  },

  async updateBudgetCategory(
    category: BudgetCategory,
  ): Promise<void> {
    throw new Error("Not implemented");
  },

  async deleteBudget(
    budgetId: string,
  ): Promise<void> {
    throw new Error("Not implemented");
  },
};
