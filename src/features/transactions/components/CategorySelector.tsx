import { Pressable, Text, View } from "react-native";

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "../constants/expenseCategories";

interface CategorySelectorProps {
  value: ExpenseCategory | null;
  onChange: (category: ExpenseCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        Category
      </Text>

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
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 20,
                backgroundColor: isSelected ? "#111" : "#f2f2f2",
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#fff" : "#111",
                  fontWeight: "500",
                }}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
