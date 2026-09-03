import { Pressable, Text, View } from "react-native";

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "../constants/expenseCategories";
import { screenStyles } from "../../../theme";

interface CategorySelectorProps {
  value: ExpenseCategory | null;
  onChange: (category: ExpenseCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={screenStyles.label}>Category</Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {EXPENSE_CATEGORIES.map((category) => {
          const isSelected = value === category;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              style={screenStyles.filterPill(isSelected)}
            >
              <Text style={screenStyles.filterPillText(isSelected)}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
