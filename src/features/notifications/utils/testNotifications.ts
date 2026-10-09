import * as notificationService from '../services/notificationService';

/**
 * Create test notifications for debugging
 */
export async function createTestNotifications(accountId: string): Promise<void> {
  console.log('[TestNotifications] Creating test notifications for account:', accountId);
  
  try {
    // Test 1: Budget warning
    await notificationService.createBudgetWarningNotification(
      accountId,
      'test-budget-1',
      'Monthly Budget',
      85
    );
    console.log('[TestNotifications] ✅ Created budget warning notification');

    // Test 2: Budget exceeded
    await notificationService.createBudgetExceededNotification(
      accountId,
      'test-budget-2',
      'Weekly Budget',
      120
    );
    console.log('[TestNotifications] ✅ Created budget exceeded notification');

    // Test 3: Goal milestone
    await notificationService.createGoalMilestoneNotification(
      accountId,
      'test-goal-1',
      'Vacation Fund',
      50
    );
    console.log('[TestNotifications] ✅ Created goal milestone notification');

    // Test 4: Goal achieved
    await notificationService.createGoalAchievedNotification(
      accountId,
      'test-goal-2',
      'Emergency Fund'
    );
    console.log('[TestNotifications] ✅ Created goal achieved notification');

    // Test 5: Low balance
    await notificationService.createLowBalanceNotification(
      accountId,
      5000,
      '₦'
    );
    console.log('[TestNotifications] ✅ Created low balance notification');

    // Test 6: Large expense
    await notificationService.createLargeExpenseNotification(
      accountId,
      'test-transaction-1',
      75000,
      '₦',
      'Shopping'
    );
    console.log('[TestNotifications] ✅ Created large expense notification');

    console.log('[TestNotifications] 🎉 All test notifications created successfully!');
  } catch (error) {
    console.error('[TestNotifications] ❌ Failed to create test notifications:', error);
    throw error;
  }
}

/**
 * Clear all test notifications
 */
export async function clearTestNotifications(accountId: string): Promise<void> {
  console.log('[TestNotifications] Clearing all notifications for account:', accountId);
  
  try {
    await notificationService.deleteAllNotifications(accountId);
    console.log('[TestNotifications] ✅ All notifications cleared');
  } catch (error) {
    console.error('[TestNotifications] ❌ Failed to clear notifications:', error);
    throw error;
  }
}
