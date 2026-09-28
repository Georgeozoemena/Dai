import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, ThemeMode } from "../contexts/ThemeContext";

export default function ThemeSettingsRoute() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; description: string; icon: string }[] = [
    {
      mode: "light",
      label: "Light",
      description: "Always use light theme",
      icon: "sunny",
    },
    {
      mode: "dark",
      label: "Dark",
      description: "Always use dark theme",
      icon: "moon",
    },
    {
      mode: "system",
      label: "System",
      description: "Follow system preferences",
      icon: "phone-portrait",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Theme</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Options */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {options.map((option, index) => (
            <Pressable
              key={option.mode}
              onPress={() => setThemeMode(option.mode)}
              style={[
                styles.option,
                index !== options.length - 1 && styles.optionBorder,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(251, 204, 51, 0.15)"
                        : "rgba(18, 14, 1, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={isDark ? colors.primary : "#120E01"}
                  />
                </View>
                <View>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
              </View>

              {themeMode === option.mode && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
          <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
            This is how your app will look with the selected theme
          </Text>

          {/* Sample content */}
          <View style={styles.previewContent}>
            <View
              style={[
                styles.sampleCard,
                {
                  backgroundColor: isDark ? "#0A0A0A" : "#FAFAFA",
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sampleHeader}>
                <View
                  style={[
                    styles.sampleIcon,
                    {
                      backgroundColor: isDark
                        ? "rgba(251, 204, 51, 0.15)"
                        : "rgba(18, 14, 1, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name="wallet"
                    size={18}
                    color={isDark ? colors.primary : "#120E01"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sampleTitle, { color: colors.text }]}>
                    Sample Card
                  </Text>
                  <Text style={[styles.sampleSubtitle, { color: colors.textSecondary }]}>
                    Subtitle text
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  previewSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  previewContent: {
    marginTop: 10,
  },
  sampleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sampleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  sampleSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
