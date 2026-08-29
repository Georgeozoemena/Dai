import type { WeeklyReview } from "../../../types/weeklyReview";

const weeklyReviews: WeeklyReview[] = [];

export async function getWeeklyReview(accountId: string, weekStart: string) {
  return (
    weeklyReviews.find(
      (review) =>
        review.accountId === accountId && review.weekStart === weekStart,
    ) ?? null
  );
}

export async function saveWeeklyReview(review: WeeklyReview) {
  const existingIndex = weeklyReviews.findIndex(
    (item) =>
      item.accountId === review.accountId &&
      item.weekStart === review.weekStart,
  );

  if (existingIndex >= 0) {
    weeklyReviews[existingIndex] = review;
  } else {
    weeklyReviews.push(review);
  }

  return review;
}
