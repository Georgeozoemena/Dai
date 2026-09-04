import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors } from "../../../theme";

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  useEffect(() => {
    // Auto-navigate after 2.5 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      {/* Abstract Logo - 4 rounded shapes forming pattern */}
      <View style={styles.logoContainer}>
        <View style={styles.logoRow}>
          <View style={[styles.logoShape, styles.shape1]} />
          <View style={[styles.logoShape, styles.shape2]} />
        </View>
        <View style={styles.logoRow}>
          <View style={[styles.logoShape, styles.shape3]} />
          <View style={[styles.logoShape, styles.shape4]} />
        </View>
      </View>

      {/* App Name */}
      <Text style={styles.appName}>Dai</Text>

      {/* Version */}
      <Text style={styles.version}>Version 1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },
  logoContainer: {
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    gap: 12,
  },
  logoShape: {
    width: 48,
    height: 48,
    backgroundColor: colors.secondary,
  },
  shape1: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 20,
  },
  shape2: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 12,
  },
  shape3: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 24,
  },
  shape4: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 16,
  },
  appName: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.secondary,
    letterSpacing: 1,
  },
  version: {
    fontSize: 14,
    color: "#999999",
    position: "absolute",
    bottom: 60,
  },
});
