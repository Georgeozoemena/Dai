import { Pressable, Text, View } from "react-native";
import { useState } from "react";

interface AmountInputProps {
  currencySymbol: string;
  value: string;
  onChange: (value: string) => void;
}

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "⌫"],
];

export function AmountInput({
  currencySymbol,
  value,
  onChange,
}: AmountInputProps) {
  const handlePress = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === ".") {
      if (value.includes(".")) {
        return;
      }

      onChange(value ? `${value}.` : "0.");
      return;
    }

    if (value === "0") {
      onChange(key);
      return;
    }

    onChange(`${value}${key}`);
  };

  return (
    <View style={{ gap: 24 }}>
      <View
        style={{
          alignItems: "center",
          paddingVertical: 24,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#666",
          }}
        >
          Amount
        </Text>

        <Text
          style={{
            fontSize: 42,
            fontWeight: "700",
            marginTop: 8,
          }}
        >
          {currencySymbol}
          {value || "0"}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {KEYS.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            {row.map((key) => (
              <Pressable
                key={key}
                onPress={() => handlePress(key)}
                style={{
                  flex: 1,
                  height: 64,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  backgroundColor: "#f2f2f2",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                  }}
                >
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
