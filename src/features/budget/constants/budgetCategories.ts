export const budgetCategories = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Education",
  "Health",
  "Family",
  "Shopping",
  "Entertainment",
  "Savings",
  "Other",
] as const;

export type BudgetCategory =
  (typeof budgetCategories)[number];
