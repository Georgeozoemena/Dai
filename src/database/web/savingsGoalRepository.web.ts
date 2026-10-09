import type { SavingsGoal, SavingsContribution } from "../../types/savingsGoal";
import type { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { getDatabase } from "./database";

const SAVINGS_GOAL_STORE = "savingsGoals";
const SAVINGS_CONTRIBUTION_STORE = "savingsContributions";

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
    
    // Delete the goal
    await db.delete(SAVINGS_GOAL_STORE, id);
    
    // Delete all contributions for this goal
    const contributions = await db.getAllFromIndex(
      SAVINGS_CONTRIBUTION_STORE,
      "goalId",
      id
    );
    
    for (const contribution of contributions) {
      await db.delete(SAVINGS_CONTRIBUTION_STORE, (contribution as SavingsContribution).id);
    }
  },

  async getContributions(goalId) {
    const db = await getDatabase();
    const contributions = await db.getAllFromIndex(
      SAVINGS_CONTRIBUTION_STORE,
      "goalId",
      goalId
    );

    return (contributions as SavingsContribution[]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  async createContribution(contribution) {
    const db = await getDatabase();
    await db.put(SAVINGS_CONTRIBUTION_STORE, contribution);
  },

  async deleteContribution(id) {
    const db = await getDatabase();
    await db.delete(SAVINGS_CONTRIBUTION_STORE, id);
  },
};
