import type { SavingsGoal, SavingsContribution } from "../../types/savingsGoal";
import type { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { getDatabase } from "../client/database";

type SavingsGoalRow = {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  frequency: string;
  suggested_amount: number;
  start_date: string;
  next_due_date: string;
  missed_payments: number;
  streak: number;
  created_at: string;
  updated_at: string;
};

type SavingsContributionRow = {
  id: string;
  goal_id: string;
  transaction_id: string | null;
  amount: number;
  note: string | null;
  date: string;
  is_scheduled_payment: number;
  payment_number: number | null;
  created_at: string;
};

function toSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    description: row.description ?? undefined,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    targetDate: row.target_date ?? undefined,
    frequency: row.frequency as "daily" | "weekly" | "monthly",
    suggestedAmount: row.suggested_amount,
    startDate: row.start_date,
    nextDueDate: row.next_due_date,
    missedPayments: row.missed_payments,
    streak: row.streak,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSavingsContribution(row: SavingsContributionRow): SavingsContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    transactionId: row.transaction_id ?? undefined,
    amount: row.amount,
    note: row.note ?? undefined,
    date: row.date,
    isScheduledPayment: row.is_scheduled_payment === 1,
    paymentNumber: row.payment_number ?? undefined,
    createdAt: row.created_at,
  };
}

export const savingsGoalRepository: SavingsGoalRepository = {
  async getSavingsGoals(accountId) {
    const db = getDatabase();

    const rows = db.getAllSync<SavingsGoalRow>(
      `SELECT * FROM savings_goals
       WHERE account_id = ?
       ORDER BY next_due_date ASC, created_at ASC`,
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
        (id, account_id, name, description, target_amount, current_amount, target_date,
         frequency, suggested_amount, start_date, next_due_date, missed_payments, streak,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         description = excluded.description,
         target_amount = excluded.target_amount,
         current_amount = excluded.current_amount,
         target_date = excluded.target_date,
         frequency = excluded.frequency,
         suggested_amount = excluded.suggested_amount,
         start_date = excluded.start_date,
         next_due_date = excluded.next_due_date,
         missed_payments = excluded.missed_payments,
         streak = excluded.streak,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      goal.id,
      goal.accountId,
      goal.name,
      goal.description ?? null,
      goal.targetAmount,
      goal.currentAmount,
      goal.targetDate ?? null,
      goal.frequency,
      goal.suggestedAmount,
      goal.startDate,
      goal.nextDueDate,
      goal.missedPayments,
      goal.streak,
      goal.createdAt,
      goal.updatedAt,
    );
  },

  async updateSavingsGoal(goal) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO savings_goals
        (id, account_id, name, description, target_amount, current_amount, target_date,
         frequency, suggested_amount, start_date, next_due_date, missed_payments, streak,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         account_id = excluded.account_id,
         name = excluded.name,
         description = excluded.description,
         target_amount = excluded.target_amount,
         current_amount = excluded.current_amount,
         target_date = excluded.target_date,
         frequency = excluded.frequency,
         suggested_amount = excluded.suggested_amount,
         start_date = excluded.start_date,
         next_due_date = excluded.next_due_date,
         missed_payments = excluded.missed_payments,
         streak = excluded.streak,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      goal.id,
      goal.accountId,
      goal.name,
      goal.description ?? null,
      goal.targetAmount,
      goal.currentAmount,
      goal.targetDate ?? null,
      goal.frequency,
      goal.suggestedAmount,
      goal.startDate,
      goal.nextDueDate,
      goal.missedPayments,
      goal.streak,
      goal.createdAt,
      goal.updatedAt,
    );
  },

  async deleteSavingsGoal(id) {
    const db = getDatabase();

    db.runSync("DELETE FROM savings_goals WHERE id = ?", id);
  },

  async getContributions(goalId) {
    const db = getDatabase();

    const rows = db.getAllSync<SavingsContributionRow>(
      `SELECT * FROM savings_contributions
       WHERE goal_id = ?
       ORDER BY date DESC, created_at DESC`,
      goalId,
    );

    return rows.map(toSavingsContribution);
  },

  async createContribution(contribution) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO savings_contributions
        (id, goal_id, transaction_id, amount, note, date, is_scheduled_payment, payment_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      contribution.id,
      contribution.goalId,
      contribution.transactionId ?? null,
      contribution.amount,
      contribution.note ?? null,
      contribution.date,
      contribution.isScheduledPayment ? 1 : 0,
      contribution.paymentNumber ?? null,
      contribution.createdAt,
    );
  },

  async deleteContribution(id) {
    const db = getDatabase();

    db.runSync("DELETE FROM savings_contributions WHERE id = ?", id);
  },
};
