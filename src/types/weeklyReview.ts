export interface WeeklyReview {
  id: string;

  accountId: string;

  weekStart: string;

  weekEnd: string;

  reflectionOne?: string;

  reflectionTwo?: string;

  reflectionThree?: string;

  createdAt: string;

  updatedAt: string;
}