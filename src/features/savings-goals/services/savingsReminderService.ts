import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import type { SavingsGoal } from '../../../types/savingsGoal';
import { isPaymentDue, isPaymentOverdue } from './savingsGoalService';
import { notificationRepository } from '../../../database/notification';
import { sendLocalPushNotification } from '../../notifications/services/pushNotificationService';

/**
 * Savings Reminder Service
 * 
 * Handles:
 * - Scheduled push notifications for savings goals
 * - Popup alerts when app is active
 * - In-app notification center messages
 */

// Storage key for scheduled notification IDs
const REMINDER_STORAGE_KEY = 'savings_goal_reminders';

interface ScheduledReminder {
  goalId: string;
  notificationId: string;
  scheduledTime: string;
}

/**
 * Schedule a reminder for a savings goal payment
 */
export async function scheduleGoalReminder(
  goal: SavingsGoal,
  reminderTime: Date = getDefaultReminderTime(goal)
): Promise<string | null> {
  try {
    // Skip scheduling if time is in the past
    if (reminderTime < new Date()) {
      console.log('[SavingsReminder] Reminder time is in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 Time to save for ${goal.name}!`,
        body: `Your ${formatCurrency(goal.suggestedAmount)} ${goal.frequency} payment is due soon. Keep your ${goal.streak} day streak going! 🔥`,
        data: {
          type: 'savings_reminder',
          goalId: goal.id,
          amount: goal.suggestedAmount,
          streak: goal.streak,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
      },
      trigger: reminderTime,
    });

    console.log(`[SavingsReminder] Scheduled notification ${notificationId} for ${goal.name} at ${reminderTime.toISOString()}`);

    // Store the notification ID for cancellation later
    await storeScheduledReminder({
      goalId: goal.id,
      notificationId,
      scheduledTime: reminderTime.toISOString(),
    });

    return notificationId;
  } catch (error) {
    console.error('[SavingsReminder] Failed to schedule reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled reminder for a goal
 */
export async function cancelGoalReminder(goalId: string): Promise<void> {
  try {
    const reminders = await getScheduledReminders();
    const reminder = reminders.find(r => r.goalId === goalId);

    if (reminder) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      await removeScheduledReminder(goalId);
      console.log(`[SavingsReminder] Cancelled reminder for goal ${goalId}`);
    }
  } catch (error) {
    console.error('[SavingsReminder] Failed to cancel reminder:', error);
  }
}

/**
 * Cancel all savings reminders
 */
export async function cancelAllGoalReminders(): Promise<void> {
  try {
    const reminders = await getScheduledReminders();

    for (const reminder of reminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    await clearScheduledReminders();
    console.log('[SavingsReminder] Cancelled all goal reminders');
  } catch (error) {
    console.error('[SavingsReminder] Failed to cancel all reminders:', error);
  }
}

/**
 * Show a popup alert for a savings goal payment reminder
 */
export function showPaymentReminderPopup(goal: SavingsGoal): void {
  const isDue = isPaymentDue(goal);
  const isOverdue = isPaymentOverdue(goal);

  let title = '💰 Time to Save!';
  let message = `Your ${formatCurrency(goal.suggestedAmount)} ${goal.frequency} payment for "${goal.name}" is ready.`;

  if (isOverdue) {
    title = '⚠️ Payment Overdue!';
    message = `Your ${formatCurrency(goal.suggestedAmount)} payment for "${goal.name}" is overdue. Don't break your ${goal.streak} day streak! 🔥`;
  } else if (isDue) {
    title = '🔔 Payment Due!';
    message = `Your ${formatCurrency(goal.suggestedAmount)} payment for "${goal.name}" is due today. Keep your streak alive! 🔥`;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Later',
        style: 'cancel',
      },
      {
        text: 'Make Payment',
        onPress: () => {
          // Navigation will be handled by the caller
          console.log(`[SavingsReminder] User chose to make payment for ${goal.id}`);
        },
      },
    ]
  );
}

/**
 * Create an in-app notification for a savings reminder
 */
export async function createSavingsReminderNotification(
  goal: SavingsGoal,
  accountId: string
): Promise<void> {
  try {
    const isDue = isPaymentDue(goal);
    const isOverdue = isPaymentOverdue(goal);

    let title = '💰 Savings Reminder';
    let message = `Time to save ${formatCurrency(goal.suggestedAmount)} for "${goal.name}"`;

    if (isOverdue) {
      title = '⚠️ Overdue Payment';
      message = `Your ${formatCurrency(goal.suggestedAmount)} payment for "${goal.name}" is overdue!`;
    } else if (isDue) {
      title = '🔔 Payment Due';
      message = `Your ${formatCurrency(goal.suggestedAmount)} payment for "${goal.name}" is due today`;
    }

    await notificationRepository.createNotification({
      id: `reminder_${goal.id}_${Date.now()}`,
      accountId,
      type: 'reminder',
      title,
      message,
      isRead: false,
      actionType: 'goal',
      actionId: goal.id,
      createdAt: new Date().toISOString(),
    });

    console.log(`[SavingsReminder] Created in-app notification for ${goal.name}`);
  } catch (error) {
    console.error('[SavingsReminder] Failed to create notification:', error);
  }
}

/**
 * Send an immediate push notification reminder
 */
export async function sendImmediateReminder(goal: SavingsGoal): Promise<void> {
  try {
    const isDue = isPaymentDue(goal);
    const isOverdue = isPaymentOverdue(goal);

    let title = `💰 Time to save for ${goal.name}!`;
    let body = `Your ${formatCurrency(goal.suggestedAmount)} ${goal.frequency} payment is ready.`;

    if (isOverdue) {
      title = `⚠️ Payment overdue: ${goal.name}`;
      body = `Don't break your ${goal.streak} day streak! ${formatCurrency(goal.suggestedAmount)} payment is overdue.`;
    } else if (isDue) {
      title = `🔔 Payment due: ${goal.name}`;
      body = `Your ${formatCurrency(goal.suggestedAmount)} payment is due today. Keep your streak! 🔥`;
    }

    await sendLocalPushNotification({
      title,
      body,
      data: {
        type: 'savings_reminder',
        goalId: goal.id,
        amount: goal.suggestedAmount,
        streak: goal.streak,
      },
    });

    console.log(`[SavingsReminder] Sent immediate reminder for ${goal.name}`);
  } catch (error) {
    console.error('[SavingsReminder] Failed to send immediate reminder:', error);
  }
}

/**
 * Check all goals and send reminders for due/overdue payments
 */
export async function checkAndSendReminders(
  goals: SavingsGoal[],
  accountId: string
): Promise<void> {
  for (const goal of goals) {
    if (isPaymentDue(goal) || isPaymentOverdue(goal)) {
      // Create in-app notification
      await createSavingsReminderNotification(goal, accountId);

      // Send push notification
      await sendImmediateReminder(goal);
    }
  }
}

/**
 * Reschedule reminders for all active goals
 */
export async function rescheduleAllReminders(goals: SavingsGoal[]): Promise<void> {
  // Cancel existing reminders
  await cancelAllGoalReminders();

  // Schedule new reminders
  for (const goal of goals) {
    // Only schedule for goals that aren't complete
    if (goal.currentAmount < goal.targetAmount) {
      await scheduleGoalReminder(goal);
    }
  }

  console.log(`[SavingsReminder] Rescheduled reminders for ${goals.length} goals`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default reminder time (1 day before due date at 9 AM)
 */
function getDefaultReminderTime(goal: SavingsGoal): Date {
  const dueDate = new Date(goal.nextDueDate);
  
  // Set reminder for 1 day before at 9 AM
  const reminderTime = new Date(dueDate);
  reminderTime.setDate(reminderTime.getDate() - 1);
  reminderTime.setHours(9, 0, 0, 0);

  // If reminder time is in the past, set for today at 9 AM
  const now = new Date();
  if (reminderTime < now) {
    reminderTime.setTime(now.getTime());
    reminderTime.setHours(9, 0, 0, 0);
    
    // If 9 AM today has passed, set for tomorrow 9 AM
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
  }

  return reminderTime;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Store scheduled reminder info
 */
async function storeScheduledReminder(reminder: ScheduledReminder): Promise<void> {
  try {
    const reminders = await getScheduledReminders();
    reminders.push(reminder);
    
    if (Platform.OS === 'web') {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
    }
  } catch (error) {
    console.error('[SavingsReminder] Failed to store reminder:', error);
  }
}

/**
 * Get all scheduled reminders
 */
async function getScheduledReminders(): Promise<ScheduledReminder[]> {
  try {
    let data: string | null = null;
    
    if (Platform.OS === 'web') {
      data = localStorage.getItem(REMINDER_STORAGE_KEY);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      data = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    }
    
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[SavingsReminder] Failed to get reminders:', error);
    return [];
  }
}

/**
 * Remove a scheduled reminder
 */
async function removeScheduledReminder(goalId: string): Promise<void> {
  try {
    const reminders = await getScheduledReminders();
    const filtered = reminders.filter(r => r.goalId !== goalId);
    
    if (Platform.OS === 'web') {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(filtered));
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('[SavingsReminder] Failed to remove reminder:', error);
  }
}

/**
 * Clear all scheduled reminders
 */
async function clearScheduledReminders(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(REMINDER_STORAGE_KEY);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('[SavingsReminder] Failed to clear reminders:', error);
  }
}
