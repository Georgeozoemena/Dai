import * as notificationDb from "../../../database/notification";
import type { Notification, NotificationType } from "../../../types/notification";
import { sendLocalPushNotification } from "./pushNotificationService";

/**
 * Create a new notification
 */
export async function createNotification(params: {
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionType?: "budget" | "goal" | "transaction" | "account";
  actionId?: string;
}): Promise<Notification> {
  const notification: Notification = {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    accountId: params.accountId,
    type: params.type,
    title: params.title,
    message: params.message,
    isRead: false,
    actionType: params.actionType,
    actionId: params.actionId,
    createdAt: new Date().toISOString(),
  };

  await notificationDb.createNotification(notification);
  
  // Also send as push notification
  try {
    await sendLocalPushNotification({
      title: params.title,
      body: params.message,
      data: {
        notificationId: notification.id,
        type: params.type,
        actionType: params.actionType,
        actionId: params.actionId,
      },
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
    // Don't fail the whole operation if push fails
  }
  
  return notification;
}

/**
 * Get all notifications for an account
 */
export async function getNotifications(accountId: string): Promise<Notification[]> {
  return notificationDb.getNotificationsByAccountId(accountId);
}

/**
 * Get unread notifications for an account
 */
export async function getUnreadNotifications(accountId: string): Promise<Notification[]> {
  return notificationDb.getUnreadNotificationsByAccountId(accountId);
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  return notificationDb.markNotificationAsRead(notificationId);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(accountId: string): Promise<void> {
  return notificationDb.markAllNotificationsAsRead(accountId);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  return notificationDb.deleteNotification(notificationId);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(accountId: string): Promise<void> {
  return notificationDb.deleteAllNotifications(accountId);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(accountId: string): Promise<number> {
  return notificationDb.getUnreadNotificationCount(accountId);
}

/**
 * Helper: Create a budget exceeded notification
 */
export async function createBudgetExceededNotification(
  accountId: string,
  budgetId: string,
  budgetName: string,
  percentage: number
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "budget_exceeded",
    title: "Budget Exceeded",
    message: `Your "${budgetName}" budget has been exceeded by ${Math.round(percentage - 100)}%.`,
    actionType: "budget",
    actionId: budgetId,
  });
}

/**
 * Helper: Create a budget warning notification (e.g., 90% reached)
 */
export async function createBudgetWarningNotification(
  accountId: string,
  budgetId: string,
  budgetName: string,
  percentage: number
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "budget_warning",
    title: "Budget Alert",
    message: `You've used ${Math.round(percentage)}% of your "${budgetName}" budget.`,
    actionType: "budget",
    actionId: budgetId,
  });
}

/**
 * Helper: Create a goal milestone notification
 */
export async function createGoalMilestoneNotification(
  accountId: string,
  goalId: string,
  goalName: string,
  percentage: number
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "goal_milestone",
    title: "Savings Milestone",
    message: `You've reached ${Math.round(percentage)}% of your "${goalName}" goal! Keep it up!`,
    actionType: "goal",
    actionId: goalId,
  });
}

/**
 * Helper: Create a goal achieved notification
 */
export async function createGoalAchievedNotification(
  accountId: string,
  goalId: string,
  goalName: string
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "goal_achieved",
    title: "Goal Achieved! 🎉",
    message: `Congratulations! You've reached your "${goalName}" savings goal!`,
    actionType: "goal",
    actionId: goalId,
  });
}

/**
 * Helper: Create a low balance notification
 */
export async function createLowBalanceNotification(
  accountId: string,
  balance: number,
  currencyCode: string
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "low_balance",
    title: "Low Balance",
    message: `Your account balance is low: ${currencyCode} ${balance.toFixed(2)}`,
    actionType: "account",
    actionId: accountId,
  });
}

/**
 * Helper: Create a large expense notification
 */
export async function createLargeExpenseNotification(
  accountId: string,
  transactionId: string,
  amount: number,
  currencyCode: string,
  category: string
): Promise<Notification> {
  return createNotification({
    accountId,
    type: "large_expense",
    title: "Large Expense Recorded",
    message: `${currencyCode} ${amount.toFixed(2)} spent on ${category}`,
    actionType: "transaction",
    actionId: transactionId,
  });
}
