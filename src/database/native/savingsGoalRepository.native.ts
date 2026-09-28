import type { SavingsGoal } from "../../types/savingsGoal";
import type { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { getDatabase } from "../client/database";

type SavingsGoalRow = {
  id: string;
  account_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
};

function toSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const savingsGoalRepository: SavingsGoalRepository = {
  async getSavingsGoals(accountId) {
    const db = getDatabase();

    const rows = db.getAllSync<SavingsGoalRow>(
      `SELECT * FROM savings_goals
       WHERE account_id = ?
       ORDER BY created_at ASC, id ASC`,
      accountId,
    );

    return rows.map(toSavingsGoal);
  },

  async getSavingsGoal(id) {
    const db = getDatabase();

    const row = db.getFirstSync<SavingsGoalRow>(
      "SELECT * FROM savings_goals WHERE id = ?",
      id,
    );

    return row ? toSavingsGoal(row) : null;
  },

  async createSavingsGoal(goal) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO savings_goals
        (id, account_id, name, target_amount, current_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         target_amount = excluded.target_amount,
         current_amount = excluded.current_amount,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      goal.id,
      goal.accountId,
      goal.name,
      goal.targetAmount,
      goal.currentAmount,
      goal.createdAt,
      goal.updatedAt,
    );
  },

  async updateSavingsGoal(goal) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO savings_goals
        (id, account_id, name, target_amount, current_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         target_amount = excluded.target_amount,
         current_amount = excluded.current_amount,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      goal.id,
      goal.accountId,
      goal.name,
      goal.targetAmount,
      goal.currentAmount,
      goal.createdAt,
      goal.updatedAt,
    );
  },

  async deleteSavingsGoal(id) {
    const db = getDatabase();

    db.runSync("DELETE FROM savings_goals WHERE id = ?", id);
  },
};
