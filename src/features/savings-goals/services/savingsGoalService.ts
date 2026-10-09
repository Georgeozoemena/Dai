import type { SavingsGoal, SavingsContribution } from "../../../types/savingsGoal";
import { savingsGoalRepository } from "../../../database/savingsGoal";
import { trackEvent } from "../../../services/analytics/analyticsService";

export async function getSavingsGoal(
  id: string,
): Promise<SavingsGoal | null> {
  const goal = await savingsGoalRepository.getSavingsGoal(id);
  
  if (!goal) return null;
  
  // Migration: Ensure all goals have required Ajo-inspired fields
  return migrateGoalToAjoStructure(goal);
}

export async function getSavingsGoals(
  accountId: string,
): Promise<SavingsGoal[]> {
  const goals = await savingsGoalRepository.getSavingsGoals(accountId);
  
  // Migration: Ensure all goals have required Ajo-inspired fields
  return goals.map(migrateGoalToAjoStructure);
}

// Helper: Migrate old goals to new Ajo-inspired structure
function migrateGoalToAjoStructure(goal: any): SavingsGoal {
  const now = new Date();
  
  // If goal already has all required fields, return as-is
  if (
    goal.frequency &&
    goal.suggestedAmount !== undefined &&
    goal.startDate &&
    goal.nextDueDate &&
    goal.streak !== undefined &&
    goal.missedPayments !== undefined
  ) {
    return goal as SavingsGoal;
  }
  
  // Migration needed - add missing fields
  const frequency = (goal.frequency as "daily" | "weekly" | "monthly") || "monthly";
  const suggestedAmount = goal.suggestedAmount || 
    calculateSuggestedAmount(
      goal.targetAmount,
      goal.currentAmount,
      goal.targetDate,
      frequency
    );
  
  const migrated: SavingsGoal = {
    ...goal,
    currentAmount: goal.currentAmount ?? 0, // Ensure currentAmount is never undefined
    frequency,
    suggestedAmount,
    startDate: goal.startDate || goal.createdAt || now.toISOString(),
    nextDueDate: goal.nextDueDate || calculateNextDueDate(now, frequency).toISOString(),
    streak: goal.streak ?? 0,
    missedPayments: goal.missedPayments ?? 0,
  };
  
  // Persist the migration (fire and forget - don't block)
  savingsGoalRepository.updateSavingsGoal(migrated).catch(error => {
    console.error("Failed to persist goal migration:", error);
  });
  
  return migrated;
}

export async function createSavingsGoal(
  goal: SavingsGoal,
): Promise<SavingsGoal> {
  await savingsGoalRepository.createSavingsGoal(goal);

  trackEvent("goal_created", {
    frequency: goal.frequency,
    hasTargetDate: !!goal.targetDate,
  });

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

export async function getContributions(
  goalId: string,
): Promise<SavingsContribution[]> {
  return savingsGoalRepository.getContributions(goalId);
}

export async function createContribution(
  contribution: SavingsContribution,
): Promise<void> {
  await savingsGoalRepository.createContribution(contribution);
  
  // Update goal current amount
  const goal = await savingsGoalRepository.getSavingsGoal(contribution.goalId);
  if (goal) {
    goal.currentAmount += contribution.amount;
    goal.updatedAt = new Date().toISOString();
    await savingsGoalRepository.updateSavingsGoal(goal);
  }
  
  trackEvent("contribution_added", {
    amount: contribution.amount,
    isScheduled: contribution.isScheduledPayment,
  });
}

export async function deleteContribution(
  contributionId: string,
  goalId: string,
  amount: number,
): Promise<void> {
  await savingsGoalRepository.deleteContribution(contributionId);
  
  // Update goal current amount
  const goal = await savingsGoalRepository.getSavingsGoal(goalId);
  if (goal) {
    goal.currentAmount -= amount;
    goal.updatedAt = new Date().toISOString();
    await savingsGoalRepository.updateSavingsGoal(goal);
  }
}

// ============================================
// AJO-INSPIRED DISCIPLINE FUNCTIONS
// (Applied to all goals, not just "Ajo" goals)
// ============================================

// Calculate next due date based on frequency
export function calculateNextDueDate(
  currentDate: Date,
  frequency: "daily" | "weekly" | "monthly"
): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

// Check if payment is due
export function isPaymentDue(goal: SavingsGoal): boolean {
  const now = new Date();
  const dueDate = new Date(goal.nextDueDate);
  
  return now >= dueDate;
}

// Check if payment is overdue (with grace period)
export function isPaymentOverdue(goal: SavingsGoal): boolean {
  const now = new Date();
  const dueDate = new Date(goal.nextDueDate);
  
  // Grace periods: 1 day for daily, 2 days for weekly, 3 days for monthly
  const graceDays = goal.frequency === "daily" ? 1 : goal.frequency === "weekly" ? 2 : 3;
  const overdueDate = new Date(dueDate);
  overdueDate.setDate(overdueDate.getDate() + graceDays);
  
  return now > overdueDate;
}

// Make a scheduled payment (uses suggested amount)
export async function makeScheduledPayment(goalId: string): Promise<void> {
  const goal = await savingsGoalRepository.getSavingsGoal(goalId);
  
  if (!goal) {
    throw new Error("Goal not found");
  }
  
  // Get contribution count for payment number
  const contributions = await savingsGoalRepository.getContributions(goalId);
  const scheduledPayments = contributions.filter(c => c.isScheduledPayment);
  const paymentNumber = scheduledPayments.length + 1;
  
  // Create contribution
  const contribution: SavingsContribution = {
    id: `${Date.now()}`,
    goalId: goal.id,
    amount: goal.suggestedAmount,
    note: `Payment #${paymentNumber}`,
    date: new Date().toISOString(),
    isScheduledPayment: true,
    paymentNumber,
    createdAt: new Date().toISOString(),
  };
  
  await createContribution(contribution);
  
  // Reload goal to get updated currentAmount (createContribution updates it)
  const updatedGoal = await savingsGoalRepository.getSavingsGoal(goalId);
  
  if (!updatedGoal) {
    throw new Error("Goal not found after contribution");
  }
  
  // Update streak and next due date
  const newStreak = updatedGoal.streak + 1;
  const nextDueDate = calculateNextDueDate(new Date(), updatedGoal.frequency);
  
  await updateSavingsGoal({
    ...updatedGoal, // Use updated goal with new currentAmount
    nextDueDate: nextDueDate.toISOString(),
    streak: newStreak,
    missedPayments: 0, // Reset missed payments on successful payment
    updatedAt: new Date().toISOString(),
  });
  
  trackEvent("scheduled_payment_made", {
    goalId: goal.id,
    paymentNumber,
    amount: goal.suggestedAmount,
    streak: newStreak,
    frequency: goal.frequency,
  });
}

// Mark payment as missed
export async function markPaymentMissed(goalId: string): Promise<void> {
  const goal = await savingsGoalRepository.getSavingsGoal(goalId);
  
  if (!goal) {
    throw new Error("Goal not found");
  }
  
  // Update missed payments and reset streak
  const nextDueDate = calculateNextDueDate(new Date(), goal.frequency);
  
  await updateSavingsGoal({
    ...goal,
    nextDueDate: nextDueDate.toISOString(),
    missedPayments: goal.missedPayments + 1,
    streak: 0, // Reset streak on missed payment
    updatedAt: new Date().toISOString(),
  });
  
  trackEvent("payment_missed", {
    goalId: goal.id,
    missedCount: goal.missedPayments + 1,
    frequency: goal.frequency,
  });
}

// Get comprehensive statistics for a goal
export function getGoalStats(goal: SavingsGoal, contributions: SavingsContribution[]) {
  const scheduledPayments = contributions.filter(c => c.isScheduledPayment);
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = contributions.length;
  const scheduledPaymentCount = scheduledPayments.length;
  
  // Calculate completion percentage
  const percentage = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;
    
  // Calculate expected payments (if start date exists)
  let expectedPayments = 0;
  const startDate = new Date(goal.startDate);
  const now = new Date();
  const daysPassed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  
  switch (goal.frequency) {
    case "daily":
      expectedPayments = Math.floor(daysPassed);
      break;
    case "weekly":
      expectedPayments = Math.floor(daysPassed / 7);
      break;
    case "monthly":
      expectedPayments = Math.floor(daysPassed / 30);
      break;
  }
  
  const complianceRate = expectedPayments > 0 
    ? ((scheduledPaymentCount / expectedPayments) * 100)
    : 100;
  
  // Calculate remaining payments needed
  const remaining = goal.targetAmount - goal.currentAmount;
  const paymentsRemaining = remaining > 0 
    ? Math.ceil(remaining / goal.suggestedAmount)
    : 0;
  
  return {
    totalPayments,
    scheduledPaymentCount,
    totalPaid,
    suggestedAmount: goal.suggestedAmount,
    currentStreak: goal.streak,
    missedPayments: goal.missedPayments,
    percentage,
    expectedPayments,
    complianceRate: Math.min(complianceRate, 100),
    paymentsRemaining,
    isDue: isPaymentDue(goal),
    isOverdue: isPaymentOverdue(goal),
    completed: goal.currentAmount >= goal.targetAmount,
  };
}

// Calculate suggested amount based on target and timeframe
export function calculateSuggestedAmount(
  targetAmount: number,
  currentAmount: number,
  targetDate: string | undefined,
  frequency: "daily" | "weekly" | "monthly"
): number {
  const remaining = targetAmount - currentAmount;
  
  if (!targetDate) {
    // No target date: suggest 10% of target per payment
    const baseAmount = targetAmount * 0.1;
    return Math.ceil(baseAmount / 100) * 100; // Round to nearest 100
  }
  
  const now = new Date();
  const target = new Date(targetDate);
  const daysRemaining = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysRemaining <= 0) {
    // Past target date: suggest paying off remainder in 3 payments
    return Math.ceil((remaining / 3) / 100) * 100;
  }
  
  // Calculate based on frequency and days remaining
  let periods = 0;
  switch (frequency) {
    case "daily":
      periods = Math.floor(daysRemaining);
      break;
    case "weekly":
      periods = Math.floor(daysRemaining / 7);
      break;
    case "monthly":
      periods = Math.floor(daysRemaining / 30);
      break;
  }
  
  if (periods === 0) periods = 1; // At least one payment
  
  const amount = remaining / periods;
  return Math.ceil(amount / 100) * 100; // Round to nearest 100
}
