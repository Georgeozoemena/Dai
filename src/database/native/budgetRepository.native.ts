import type {
  Budget,
  BudgetCategory,
} from "../../features/budget/types/budget";

import type { BudgetRepository } from "../repositories/budgetRepository";

import { getDatabase } from "../client/database";

type BudgetRow = {
  id: string;
  account_id: string;
  name: string;
  period: string;
  month: string;
  total_income: number;
  total_budget: number;
  created_at: string;
  updated_at: string;
};

type BudgetCategoryRow = {
  id: string;
  budget_id: string;
  category: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    period: row.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
    month: row.month,
    totalIncome: row.total_income,
    totalBudget: row.total_budget,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBudgetCategory(
  row: BudgetCategoryRow,
): BudgetCategory {
  return {
    id: row.id,
    budgetId: row.budget_id,
    category: row.category,
    amount: row.amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const budgetRepository: BudgetRepository = {
  async getBudget(
    accountId: string,
    month: string,
  ): Promise<Budget | null> {
    const db = getDatabase();

    const row = db.getFirstSync<BudgetRow>(
      `SELECT * FROM budgets
       WHERE account_id = ? AND month = ?
       LIMIT 1`,
      accountId,
      month,
    );

    return row ? toBudget(row) : null;
  },

  async getAllBudgets(accountId: string): Promise<Budget[]> {
    const db = getDatabase();

    const rows = db.getAllSync<BudgetRow>(
      `SELECT * FROM budgets
       WHERE account_id = ?
       ORDER BY created_at DESC`,
      accountId,
    );

    return rows.map(toBudget);
  },

  async getBudgetById(budgetId: string): Promise<Budget | null> {
    const db = getDatabase();

    const row = db.getFirstSync<BudgetRow>(
      `SELECT * FROM budgets WHERE id = ?`,
      budgetId,
    );

    return row ? toBudget(row) : null;
  },

  async getBudgetCategories(
    budgetId: string,
  ): Promise<BudgetCategory[]> {
    const db = getDatabase();

    const rows = db.getAllSync<BudgetCategoryRow>(
      `SELECT * FROM budget_categories
       WHERE budget_id = ?
       ORDER BY created_at ASC, id ASC`,
      budgetId,
    );

    return rows.map(toBudgetCategory);
  },

  async createBudget(budget: Budget): Promise<void> {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO budgets
        (id, account_id, name, period, month, total_income, total_budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         period = excluded.period,
         month = excluded.month,
         total_income = excluded.total_income,
         total_budget = excluded.total_budget,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      budget.id,
      budget.accountId,
      budget.name,
      budget.period,
      budget.month,
      budget.totalIncome,
      budget.totalBudget,
      budget.createdAt,
      budget.updatedAt,
    );
  },

  async createBudgetCategory(
    category: BudgetCategory,
  ): Promise<void> {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO budget_categories
        (id, budget_id, category, amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         budget_id = excluded.budget_id,
         category = excluded.category,
         amount = excluded.amount,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      category.id,
      category.budgetId,
      category.category,
      category.amount,
      category.createdAt,
      category.updatedAt,
    );
  },

  async updateBudget(budget: Budget): Promise<void> {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO budgets
        (id, account_id, name, period, month, total_income, total_budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         period = excluded.period,
         month = excluded.month,
         total_income = excluded.total_income,
         total_budget = excluded.total_budget,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      budget.id,
      budget.accountId,
      budget.name,
      budget.period,
      budget.month,
      budget.totalIncome,
      budget.totalBudget,
      budget.createdAt,
      budget.updatedAt,
    );
  },

  async updateBudgetCategory(
    category: BudgetCategory,
  ): Promise<void> {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO budget_categories
        (id, budget_id, category, amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         budget_id = excluded.budget_id,
         category = excluded.category,
         amount = excluded.amount,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      category.id,
      category.budgetId,
      category.category,
      category.amount,
      category.createdAt,
      category.updatedAt,
    );
  },

  async deleteBudget(
    budgetId: string,
  ): Promise<void> {
    const db = getDatabase();

    db.runSync(
      "DELETE FROM budget_categories WHERE budget_id = ?",
      budgetId,
    );

    db.runSync("DELETE FROM budgets WHERE id = ?", budgetId);
  },
};
