import type {
  Budget,
  BudgetCategory,
} from "../types/budget";

import {
  budgetRepository,
} from "../../../database/budget";

export async function getBudget(
  accountId: string,
  month: string,
) {
  return budgetRepository.getBudget(
    accountId,
    month,
  );
}

export async function getBudgetCategories(
  budgetId: string,
) {
  return budgetRepository.getBudgetCategories(
    budgetId,
  );
}

export async function createBudget(
  budget: Budget,
) {
  await budgetRepository.createBudget(
    budget,
  );

  return budget;
}

export async function createBudgetCategory(
  category: BudgetCategory,
) {
  await budgetRepository.createBudgetCategory(
    category,
  );

  return category;
}

export async function updateBudget(
  budget: Budget,
) {
  await budgetRepository.updateBudget(
    budget,
  );

  return budget;
}

export async function updateBudgetCategory(
  category: BudgetCategory,
) {
  await budgetRepository.updateBudgetCategory(
    category,
  );

  return category;
}

export async function deleteBudget(
  budgetId: string,
) {
  await budgetRepository.deleteBudget(
    budgetId,
  );
}
