export interface SavingsGoal {
  id: string;

  accountId: string;

  name: string;

  targetAmount: number;

  currentAmount: number;

  createdAt: string;

  updatedAt: string;
}