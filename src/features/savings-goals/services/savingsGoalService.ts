import type { SavingsGoal } from "../../../types/savingsGoal";
import { savingsGoalRepository } from "../../../database/savingsGoal";

export async function getSavingsGoals(
  accountId: string,
): Promise<SavingsGoal[]> {
  return savingsGoalRepository.getSavingsGoals(accountId);
}

export async function getSavingsGoal(
  id: string,
): Promise<SavingsGoal | null> {
  return savingsGoalRepository.getSavingsGoal(id);
}

export async function createSavingsGoal(
  goal: SavingsGoal,
): Promise<SavingsGoal> {
  await savingsGoalRepository.createSavingsGoal(goal);
  return goal;
}

export async function updateSavingsGoal(
  goal: SavingsGoal,
): Promise<SavingsGoal> {
  await savingsGoalRepository.updateSavingsGoal(goal);
  return goal;
}

export async function deleteSavingsGoal(
  id: string,
): Promise<void> {
  await savingsGoalRepository.deleteSavingsGoal(id);
}

export async function addToSavingsGoal(
  goalId: string,
  amount: number,
): Promise<void> {
  const goal = await savingsGoalRepository.getSavingsGoal(goalId);
  
  if (!goal) {
    throw new Error("Savings goal not found");
  }

  goal.currentAmount += amount;
  goal.updatedAt = new Date().toISOString();

  await savingsGoalRepository.updateSavingsGoal(goal);
}
