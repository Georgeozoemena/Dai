import type { SavingsGoal, SavingsContribution } from "../../types/savingsGoal";

export interface SavingsGoalRepository {
  getSavingsGoals(accountId: string): Promise<SavingsGoal[]>;

  getSavingsGoal(id: string): Promise<SavingsGoal | null>;

  createSavingsGoal(goal: SavingsGoal): Promise<void>;

  updateSavingsGoal(goal: SavingsGoal): Promise<void>;

  deleteSavingsGoal(id: string): Promise<void>;

  // Contributions
  getContributions(goalId: string): Promise<SavingsContribution[]>;

  createContribution(contribution: SavingsContribution): Promise<void>;

  deleteContribution(id: string): Promise<void>;
}
