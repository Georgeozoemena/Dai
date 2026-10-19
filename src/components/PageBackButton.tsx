import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../theme";

interface PageBackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function PageBackButton({ onPress, style }: PageBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress}
      style={[styles.button, style]}
    >
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginLeft: -4,
  },
});
