export type NotificationType = 
  | 'budget_exceeded'
  | 'budget_warning'
  | 'budget_reached'
  | 'goal_milestone'
  | 'goal_achieved'
  | 'low_balance'
  | 'large_expense'
  | 'reminder'
  | 'system';

export interface Notification {
  id: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionType?: 'budget' | 'goal' | 'transaction' | 'account';
  actionId?: string; // ID of the related budget/goal/transaction
  createdAt: string;
}
