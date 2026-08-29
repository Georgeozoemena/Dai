import type {
  Budget,
  BudgetCategory,
} from "../../features/budget/types/budget";

import type { BudgetRepository } from "../repositories/budgetRepository";

import { getDatabase } from "./database";

const BUDGET_STORE = "budgets";
const CATEGORY_STORE = "budgetCategories";

export const budgetRepository: BudgetRepository = {
  async getBudget(accountId, month) {
    const db = await getDatabase();
    const budgets = await db.getAll(BUDGET_STORE);

    return (
      budgets.find(
        (budget: Budget) =>
          budget.accountId === accountId &&
          budget.month === month,
      ) ?? null
    );
  },

  async getBudgetCategories(budgetId) {
    const db = await getDatabase();
    const categories =
      await db.getAll(CATEGORY_STORE);

    return categories.filter(
      (category: BudgetCategory) =>
        category.budgetId === budgetId,
    );
  },

  async createBudget(budget) {
    const db = await getDatabase();
    await db.put(BUDGET_STORE, budget);
  },

  async createBudgetCategory(category) {
    const db = await getDatabase();
    await db.put(CATEGORY_STORE, category);
  },

  async updateBudget(budget) {
    const db = await getDatabase();
    await db.put(BUDGET_STORE, budget);
  },

  async updateBudgetCategory(category) {
    const db = await getDatabase();
    await db.put(CATEGORY_STORE, category);
  },

  async deleteBudget(budgetId) {
    const db = await getDatabase();
    await db.delete(BUDGET_STORE, budgetId);

    const categories =
      await db.getAll(CATEGORY_STORE);

    const budgetCategories =
      categories.filter(
        (category: BudgetCategory) =>
          category.budgetId === budgetId,
      );

    for (const category of budgetCategories) {
      await db.delete(
        CATEGORY_STORE,
        category.id,
      );
    }
  },
};
