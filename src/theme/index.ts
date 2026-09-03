export const colors = {
  primary: "#FBCC33",
  secondary: "#120E01",
  background: "#f8f8f8",
  surface: "#ffffff",
  text: "#120E01",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#f3f3f3",
  borderInput: "#eeeeee",
  success: "#1a9c4b",
  error: "#d00000",
  warning: "#e6a700",
  overlay: "rgba(0,0,0,0.5)",
};

export const radii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 20,
  full: 999,
};

export const layout = {
  screenPadding: 20,
  sectionGap: 24,
};

export const screenStyles = {
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 32,
    gap: layout.sectionGap,
  },
  centered: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: "center" as const,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  outlineButton: {
    paddingVertical: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderInput,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    fontWeight: "600" as const,
    color: colors.text,
    fontSize: 16,
  },
  filterPill: (selected: boolean) => ({
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: selected ? colors.secondary : colors.surface,
  }),
  filterPillText: (selected: boolean) => ({
    color: selected ? colors.primary : colors.text,
    fontWeight: "600" as const,
  }),
  emptyState: {
    paddingVertical: 40,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 8,
  },
  listItem: (isLast: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.border,
  }),
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  settingsRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 18,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "70%" as const,
  },
};
