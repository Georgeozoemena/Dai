import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SELECTED_BUDGET_KEY = "@dai_selected_budget";

interface BudgetState {
  selectedBudgetId: string | null;
  setSelectedBudget: (budgetId: string | null) => Promise<void>;
  clearSelectedBudget: () => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  selectedBudgetId: null,

  setSelectedBudget: async (budgetId) => {
    try {
      if (budgetId) {
        await AsyncStorage.setItem(SELECTED_BUDGET_KEY, budgetId);
      } else {
        await AsyncStorage.removeItem(SELECTED_BUDGET_KEY);
      }
      set({ selectedBudgetId: budgetId });
    } catch (error) {
      console.error("Failed to save selected budget:", error);
    }
  },

  clearSelectedBudget: async () => {
    try {
      await AsyncStorage.removeItem(SELECTED_BUDGET_KEY);
      set({ selectedBudgetId: null });
    } catch (error) {
      console.error("Failed to clear selected budget:", error);
    }
  },
}));

// Load selected budget on app start
if (Platform.OS !== "web") {
  AsyncStorage.getItem(SELECTED_BUDGET_KEY).then((budgetId) => {
    if (budgetId) {
      useBudgetStore.setState({ selectedBudgetId: budgetId });
    }
  });
} else {
  // For web, use localStorage
  const budgetId = localStorage.getItem(SELECTED_BUDGET_KEY);
  if (budgetId) {
    useBudgetStore.setState({ selectedBudgetId: budgetId });
  }
}
