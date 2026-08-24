import { Pressable, Text, View } from "react-native";

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 36,
          fontWeight: "700",
        }}
      >
        Welcome to Denari
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontSize: 16,
          color: "#666",
          lineHeight: 24,
        }}
      >
        Take control of your money, track your spending, and understand your
        finances.
      </Text>

      <Pressable
        onPress={onComplete}
        style={{
          marginTop: 32,
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}
