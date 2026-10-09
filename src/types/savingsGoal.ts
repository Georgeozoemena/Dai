export interface SavingsGoal {
  id: string;

  accountId: string;

  name: string;

  description?: string;

  targetAmount: number;

  currentAmount: number;

  targetDate?: string;

  // Ajo concept - core to all savings goals
  frequency: "daily" | "weekly" | "monthly";
  suggestedAmount: number;
  startDate: string;
  nextDueDate: string;
  missedPayments: number;
  streak: number;

  createdAt: string;

  updatedAt: string;
}

export interface SavingsContribution {
  id: string;

  goalId: string;

  transactionId?: string;

  amount: number;

  note?: string;

  date: string;

  // Track if this is a regular scheduled payment
  isScheduledPayment: boolean;
  paymentNumber?: number;

  createdAt: string;
}

export type SavingsFrequency = "daily" | "weekly" | "monthly";