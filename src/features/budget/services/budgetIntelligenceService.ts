import type { Budget, BudgetCategory } from '../types/budget';
import type { Transaction } from '../../../types/transaction';
import { getBudgetCategories, getAllBudgets } from './budgetService';
import { getTransactions } from '../../transactions/services/transactionService';

/**
 * Suggestion level for budget adjustments
 */
export type SuggestionLevel = 'conservative' | 'moderate' | 'aggressive';

/**
 * Category performance status
 */
export type CategoryStatus = 'under' | 'on-track' | 'over' | 'exceeded';

/**
 * Smart budget suggestion for a category
 */
export interface BudgetSuggestion {
  category: string;
  previousBudget: number;
  actualSpent: number;
  percentage: number;
  status: CategoryStatus;
  suggestions: {
    conservative: number;  // Keep original or minimal adjustment
    moderate: number;      // Balanced adjustment
    aggressive: number;    // Match actual spending
  };
  recommended: SuggestionLevel;
  insight: string;
}

/**
 * Complete budget intelligence for a month
 */
export interface BudgetIntelligence {
  previousMonth: string;
  totalPreviousBudget: number;
  totalSpent: number;
  overallPerformance: number; // percentage
  categorySuggestions: BudgetSuggestion[];
  insights: string[];
}

/**
 * Calculate category status based on percentage used
 */
function getCategoryStatus(percentage: number): CategoryStatus {
  if (percentage > 100) return 'exceeded';
  if (percentage >= 90) return 'over';
  if (percentage >= 70) return 'on-track';
  return 'under';
}

/**
 * Generate smart suggestions for a category
 */
function generateCategorySuggestions(
  category: string,
  budgeted: number,
  spent: number
): BudgetSuggestion {
  const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const status = getCategoryStatus(percentage);
  const difference = spent - budgeted;

  // Conservative: Keep original or small adjustment
  let conservative = budgeted;
  if (percentage > 120) {
    conservative = budgeted * 1.1; // Only +10% if severely exceeded
  }

  // Moderate: Balanced adjustment
  let moderate = budgeted;
  if (percentage > 100) {
    // If exceeded, increase by 25% of the overage
    moderate = budgeted + (difference * 0.25);
  } else if (percentage < 70) {
    // If significantly under, reduce by 10%
    moderate = budgeted * 0.9;
  }

  // Aggressive: Match actual spending or adjust significantly
  let aggressive = spent;
  if (percentage < 50) {
    // If way under budget, don't slash too much
    aggressive = budgeted * 0.8;
  }

  // Round to nearest 100
  conservative = Math.round(conservative / 100) * 100;
  moderate = Math.round(moderate / 100) * 100;
  aggressive = Math.round(aggressive / 100) * 100;

  // Determine recommendation
  let recommended: SuggestionLevel = 'conservative';
  if (percentage > 120) {
    recommended = 'moderate'; // Definitely need to adjust
  } else if (percentage > 100) {
    recommended = 'moderate'; // Slightly over
  } else if (percentage < 60) {
    recommended = 'moderate'; // Way under, can reduce
  }

  // Generate insight
  let insight = '';
  if (percentage > 120) {
    insight = `Significantly over budget. Consider increasing allocation.`;
  } else if (percentage > 100) {
    insight = `Slightly exceeded. A small increase may help.`;
  } else if (percentage >= 90 && percentage <= 100) {
    insight = `Perfect! This budget worked well.`;
  } else if (percentage >= 70) {
    insight = `On track. Current budget seems appropriate.`;
  } else if (percentage < 50) {
    insight = `Barely used. Consider reducing allocation.`;
  } else {
    insight = `Under budget. You're doing great!`;
  }

  return {
    category,
    previousBudget: budgeted,
    actualSpent: spent,
    percentage,
    status,
    suggestions: {
      conservative,
      moderate,
      aggressive,
    },
    recommended,
    insight,
  };
}

/**
 * Analyze previous budget and generate smart suggestions
 */
export async function analyzePreviousBudget(
  accountId: string,
  targetMonth?: string
): Promise<BudgetIntelligence | null> {
  try {
    // Get all budgets for this account
    const allBudgets = await getAllBudgets(accountId);
    
    if (allBudgets.length === 0) {
      return null;
    }

    // Sort by month descending
    allBudgets.sort((a, b) => b.month.localeCompare(a.month));

    // Get the most recent budget (or specific month if provided)
    let previousBudget: Budget;
    if (targetMonth) {
      const found = allBudgets.find(b => b.month === targetMonth);
      if (!found) return null;
      previousBudget = found;
    } else {
      previousBudget = allBudgets[0];
    }

    // Get categories for that budget
    const categories = await getBudgetCategories(previousBudget.id);
    
    if (categories.length === 0) {
      return null;
    }

    // Get transactions for that month
    const allTransactions = await getTransactions(accountId);
    const monthTransactions = allTransactions.filter(t => {
      const txDate = new Date(t.date);
      const budgetDate = new Date(previousBudget.month);
      return (
        txDate.getMonth() === budgetDate.getMonth() &&
        txDate.getFullYear() === budgetDate.getFullYear() &&
        t.type === 'expense'
      );
    });

    // Calculate spending per category
    const spendingByCategory = new Map<string, number>();
    for (const tx of monthTransactions) {
      const current = spendingByCategory.get(tx.category) || 0;
      spendingByCategory.set(tx.category, current + tx.amount);
    }

    // Generate suggestions for each category
    const categorySuggestions: BudgetSuggestion[] = categories.map(cat => {
      const spent = spendingByCategory.get(cat.category) || 0;
      return generateCategorySuggestions(cat.category, cat.amount, spent);
    });

    // Calculate totals
    const totalPreviousBudget = categories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalSpent = Array.from(spendingByCategory.values()).reduce((sum, amt) => sum + amt, 0);
    const overallPerformance = totalPreviousBudget > 0 
      ? (totalSpent / totalPreviousBudget) * 100 
      : 0;

    // Generate overall insights
    const insights: string[] = [];
    
    if (overallPerformance > 110) {
      insights.push(`Overall spending exceeded budget by ${Math.round(overallPerformance - 100)}%`);
    } else if (overallPerformance > 100) {
      insights.push(`You went slightly over budget by ${Math.round(overallPerformance - 100)}%`);
    } else if (overallPerformance >= 90) {
      insights.push(`Excellent! You stayed within budget at ${Math.round(overallPerformance)}%`);
    } else if (overallPerformance >= 70) {
      insights.push(`Great job! You used ${Math.round(overallPerformance)}% of your budget`);
    } else {
      insights.push(`You only used ${Math.round(overallPerformance)}% of your budget`);
    }

    // Category-specific insights
    const exceededCategories = categorySuggestions.filter(s => s.status === 'exceeded');
    const underCategories = categorySuggestions.filter(s => s.status === 'under');

    if (exceededCategories.length > 0) {
      const categories = exceededCategories.map(s => s.category).join(', ');
      insights.push(`Exceeded in: ${categories}`);
    }

    if (underCategories.length > 0 && underCategories.length >= 3) {
      insights.push(`You have room to reduce budget in ${underCategories.length} categories`);
    }

    const perfectCategories = categorySuggestions.filter(
      s => s.percentage >= 90 && s.percentage <= 100
    );
    if (perfectCategories.length > 0) {
      insights.push(`${perfectCategories.length} categories were perfectly budgeted!`);
    }

    return {
      previousMonth: previousBudget.month,
      totalPreviousBudget,
      totalSpent,
      overallPerformance,
      categorySuggestions,
      insights,
    };
  } catch (error) {
    console.error('Failed to analyze previous budget:', error);
    return null;
  }
}

/**
 * Get recommended budget amount for a category based on history
 */
export function getRecommendedAmount(suggestion: BudgetSuggestion): number {
  return suggestion.suggestions[suggestion.recommended];
}

/**
 * Calculate adaptive alert threshold for a category
 * Based on historical overspending patterns
 */
export interface AdaptiveAlert {
  category: string;
  standardThreshold: number; // 75% default
  adaptiveThreshold: number; // Adjusted based on pattern
  reasoning: string;
}

/**
 * Generate adaptive alert thresholds based on spending patterns
 */
export function calculateAdaptiveAlerts(
  categorySuggestions: BudgetSuggestion[]
): AdaptiveAlert[] {
  return categorySuggestions.map(suggestion => {
    const standardThreshold = 75; // Default 75% alert
    let adaptiveThreshold = standardThreshold;
    let reasoning = 'Standard 75% alert threshold';

    // If consistently exceeds, alert earlier
    if (suggestion.percentage > 120) {
      adaptiveThreshold = 60;
      reasoning = 'Alerting at 60% - you tend to exceed this category significantly';
    } else if (suggestion.percentage > 100) {
      adaptiveThreshold = 65;
      reasoning = 'Alerting at 65% - you often exceed this category';
    } else if (suggestion.percentage < 60) {
      adaptiveThreshold = 85;
      reasoning = 'Alerting at 85% - you rarely reach this limit';
    } else if (suggestion.percentage >= 90 && suggestion.percentage <= 100) {
      adaptiveThreshold = 75;
      reasoning = 'Standard threshold - your budgeting is accurate';
    }

    return {
      category: suggestion.category,
      standardThreshold,
      adaptiveThreshold,
      reasoning,
    };
  });
}
