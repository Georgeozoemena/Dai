import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as notificationService from "./notificationService";

// Track which notifications have been sent to avoid duplicates
const NOTIFICATION_TRACKER_PREFIX = "@notification_sent_";

/**
 * Check if a notification has already been sent
 */
async function hasNotificationBeenSent(key: string): Promise<boolean> {
  try {
    const storageKey = `${NOTIFICATION_TRACKER_PREFIX}${key}`;
    
    if (Platform.OS === "web") {
      return localStorage.getItem(storageKey) !== null;
    } else {
      const value = await AsyncStorage.getItem(storageKey);
      return value !== null;
    }
  } catch (error) {
    console.error("Failed to check notification tracker:", error);
    return false;
  }
}

/**
 * Mark a notification as sent
 */
async function markNotificationAsSent(key: string): Promise<void> {
  try {
    const storageKey = `${NOTIFICATION_TRACKER_PREFIX}${key}`;
    const timestamp = new Date().toISOString();
    
    if (Platform.OS === "web") {
      localStorage.setItem(storageKey, timestamp);
    } else {
      await AsyncStorage.setItem(storageKey, timestamp);
    }
  } catch (error) {
    console.error("Failed to mark notification as sent:", error);
  }
}

/**
 * Check budget health and trigger notifications if needed
 */
export async function checkBudgetHealth(params: {
  accountId: string;
  budgetId: string;
  budgetName: string;
  totalSpent: number;
  totalBudget: number;
}): Promise<void> {
  const { accountId, budgetId, budgetName, totalSpent, totalBudget } = params;

  if (totalBudget <= 0) return;

  const percentage = (totalSpent / totalBudget) * 100;

  // Budget exceeded (100%+)
  if (percentage >= 100) {
    const notificationKey = `budget_exceeded_${budgetId}_${Math.floor(percentage / 10) * 10}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createBudgetExceededNotification(
        accountId,
        budgetId,
        budgetName,
        percentage
      );
      await markNotificationAsSent(notificationKey);
    }
  }
  // Budget warning (90%+)
  else if (percentage >= 90) {
    const notificationKey = `budget_warning_90_${budgetId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createBudgetWarningNotification(
        accountId,
        budgetId,
        budgetName,
        percentage
      );
      await markNotificationAsSent(notificationKey);
    }
  }
  // Budget warning (75%+)
  else if (percentage >= 75) {
    const notificationKey = `budget_warning_75_${budgetId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createBudgetWarningNotification(
        accountId,
        budgetId,
        budgetName,
        percentage
      );
      await markNotificationAsSent(notificationKey);
    }
  }
}

/**
 * Check savings goal progress and trigger notifications if needed
 */
export async function checkGoalProgress(params: {
  accountId: string;
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
}): Promise<void> {
  const { accountId, goalId, goalName, currentAmount, targetAmount } = params;

  if (targetAmount <= 0) return;

  const percentage = (currentAmount / targetAmount) * 100;

  // Goal achieved (100%+)
  if (percentage >= 100) {
    const notificationKey = `goal_achieved_${goalId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createGoalAchievedNotification(
        accountId,
        goalId,
        goalName
      );
      await markNotificationAsSent(notificationKey);
    }
  }
  // 75% milestone
  else if (percentage >= 75) {
    const notificationKey = `goal_milestone_75_${goalId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createGoalMilestoneNotification(
        accountId,
        goalId,
        goalName,
        75
      );
      await markNotificationAsSent(notificationKey);
    }
  }
  // 50% milestone
  else if (percentage >= 50) {
    const notificationKey = `goal_milestone_50_${goalId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createGoalMilestoneNotification(
        accountId,
        goalId,
        goalName,
        50
      );
      await markNotificationAsSent(notificationKey);
    }
  }
  // 25% milestone
  else if (percentage >= 25) {
    const notificationKey = `goal_milestone_25_${goalId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createGoalMilestoneNotification(
        accountId,
        goalId,
        goalName,
        25
      );
      await markNotificationAsSent(notificationKey);
    }
  }
}

/**
 * Check account balance and trigger low balance notification if needed
 */
export async function checkLowBalance(params: {
  accountId: string;
  balance: number;
  currencyCode: string;
  threshold: number;
}): Promise<void> {
  const { accountId, balance, currencyCode, threshold } = params;

  if (balance < threshold) {
    // Send notification once per day
    const today = new Date().toISOString().slice(0, 10);
    const notificationKey = `low_balance_${accountId}_${today}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createLowBalanceNotification(
        accountId,
        balance,
        currencyCode
      );
      await markNotificationAsSent(notificationKey);
    }
  }
}

/**
 * Check for large expense and trigger notification if needed
 */
export async function checkLargeExpense(params: {
  accountId: string;
  transactionId: string;
  amount: number;
  currencyCode: string;
  category: string;
  threshold: number;
}): Promise<void> {
  const { accountId, transactionId, amount, currencyCode, category, threshold } = params;

  if (amount >= threshold) {
    const notificationKey = `large_expense_${transactionId}`;
    const alreadySent = await hasNotificationBeenSent(notificationKey);

    if (!alreadySent) {
      await notificationService.createLargeExpenseNotification(
        accountId,
        transactionId,
        amount,
        currencyCode,
        category
      );
      await markNotificationAsSent(notificationKey);
    }
  }
}

/**
 * Clear notification trackers for a specific budget (e.g., when a new period starts)
 */
export async function clearBudgetNotificationTrackers(budgetId: string): Promise<void> {
  try {
    const keysToRemove = [
      `${NOTIFICATION_TRACKER_PREFIX}budget_exceeded_${budgetId}`,
      `${NOTIFICATION_TRACKER_PREFIX}budget_warning_90_${budgetId}`,
      `${NOTIFICATION_TRACKER_PREFIX}budget_warning_75_${budgetId}`,
    ];

    if (Platform.OS === "web") {
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } else {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error("Failed to clear budget notification trackers:", error);
  }
}

/**
 * Clear notification trackers for a specific goal
 */
export async function clearGoalNotificationTrackers(goalId: string): Promise<void> {
  try {
    const keysToRemove = [
      `${NOTIFICATION_TRACKER_PREFIX}goal_achieved_${goalId}`,
      `${NOTIFICATION_TRACKER_PREFIX}goal_milestone_75_${goalId}`,
      `${NOTIFICATION_TRACKER_PREFIX}goal_milestone_50_${goalId}`,
      `${NOTIFICATION_TRACKER_PREFIX}goal_milestone_25_${goalId}`,
    ];

    if (Platform.OS === "web") {
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } else {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error("Failed to clear goal notification trackers:", error);
  }
}
