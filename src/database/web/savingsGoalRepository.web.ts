import type { SavingsGoal } from "../../types/savingsGoal";
import type { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { getDatabase } from "./database";

const SAVINGS_GOAL_STORE = "savingsGoals";

export const savingsGoalRepository: SavingsGoalRepository = {
  async getSavingsGoals(accountId) {
    const db = await getDatabase();
    const goals = await db.getAll(SAVINGS_GOAL_STORE);

    return goals.filter(
      (goal: SavingsGoal) =>
        goal.accountId === accountId,
    );
  },

  async getSavingsGoal(id) {
    const db = await getDatabase();
    const goal = await db.get(SAVINGS_GOAL_STORE, id);

    return (goal as SavingsGoal | undefined) ?? null;
  },

  async createSavingsGoal(goal) {
    const db = await getDatabase();
    await db.put(SAVINGS_GOAL_STORE, goal);
  },

  async updateSavingsGoal(goal) {
    const db = await getDatabase();
    await db.put(SAVINGS_GOAL_STORE, goal);
  },

  async deleteSavingsGoal(id) {
    const db = await getDatabase();
    await db.delete(SAVINGS_GOAL_STORE, id);
  },
};
