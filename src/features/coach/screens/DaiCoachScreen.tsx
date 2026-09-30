import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { BudgetOverview } from "../../budget/services/budgetOverviewService";
import type {
  DeterministicInsight,
} from "../services/deterministicInsights";
import type { FinanceCoachAdvice } from "../types";

import { useAccountStore } from "../../../store/account/accountStore";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

import { buildBudgetOverview } from "../../budget/services/budgetOverviewService";
import { formatMonthLabel } from "../../budget/services/monthUtils";
import { getMonthPeriod } from "../services/financeContextBuilder";
import { buildDeterministicInsights } from "../services/deterministicInsights";
import {
  buildFinanceCoachContext,
} from "../services/financeContextBuilder";
import {
  financeCoachProvider,
  FinanceCoachError,
} from "../services/financeCoachProvider";

import { getSavingsGoals } from "../../savings-goals/services/savingsGoalService";
import { trackEvent } from "../../../services/analytics/analyticsService";

import { colors } from "../../../theme";
import { formatCurrency } from "../../../utils/currency";

// ========== Static AI Avatar Component ==========
function AnimatedAIAvatar({ isThinking }: { isThinking: boolean }) {
  return (
    <View style={styles.aiAvatar}>
      {/* Soft glow layers */}
      <View style={[styles.aiGlowOuter, { opacity: 0.2 }]} />
      <View style={[styles.aiGlowMiddle, { opacity: 0.35 }]} />

      {/* 3D Ball with gradient - Vibrant Red */}
      <LinearGradient
        colors={["#FF6B4A", "#FF4520", "#E63900"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiAvatarCore}
      >
        {/* Top shine effect for 3D appearance */}
        <View style={styles.aiShine} />
        
        {/* Subtle gradient overlay for depth */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.4)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={styles.aiShineOverlay}
        />
        
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

// ========== Animated Progress Bar Component ==========
function AnimatedProgressBar({
  value,
  maxValue,
  color,
  label,
  subtext,
}: {
  value: number;
  maxValue: number;
  color: string;
  label: string;
  subtext: string;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate from 0 to actual percentage
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: Math.min(percentage, 100),
        duration: 1200,
        delay: 300,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 800,
          delay: 200,
          useNativeDriver: false,
        }),
        Animated.timing(heightAnim, {
          toValue: 0.95,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [value, maxValue, widthAnim, heightAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <View style={styles.progressCard}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressSubtext}>{subtext}</Text>
      <Text style={styles.progressValue}>{formatCurrency(value, "NGN")}</Text>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedWidth,
              height: animatedHeight,
              backgroundColor: color,
              opacity: 0.8,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function DaiCoachScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [insights, setInsights] = useState<DeterministicInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  const [advice, setAdvice] = useState<FinanceCoachAdvice | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ========== Export Functionality ==========
  const handleExportTransactions = async () => {
    if (!currentAccountId || exporting) return;

    try {
      setExporting(true);

      const { getTransactions } = await import(
        "../../transactions/services/transactionService"
      );
      const { exportTransactionsToCsv } = await import(
        "../../settings/services/exportService"
      );

      const transactions = await getTransactions(currentAccountId);

      if (transactions.length === 0) {
        Alert.alert(
          "No Transactions",
          "You don't have any transactions to export yet.",
        );
        return;
      }

      await exportTransactionsToCsv(transactions);

      trackEvent("transactions_exported", {
        count: transactions.length,
        source: "coach_screen",
      });

      if (Platform.OS !== "web") {
        Alert.alert("Success", "Your transactions have been exported!");
      }
    } catch (error) {
      console.error("FAILED TO EXPORT TRANSACTIONS:", error);
      Alert.alert(
        "Export Failed",
        "Something went wrong while exporting your transactions.",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportBudgetReport = async () => {
    if (!currentAccountId || exporting) return;

    try {
      setExporting(true);

      const { getAccount } = await import("../../accounts/services/accountService");
      const { buildBudgetReport } = await import(
        "../../reports/services/budgetReportService"
      );
      const { exportBudgetReportPdf } = await import(
        "../../reports/services/reportPdfService"
      );

      const account = await getAccount(currentAccountId);
      
      if (!account) {
        Alert.alert("Error", "Account not found. Please select an account.");
        return;
      }

      const month = overview?.month || new Date().toISOString().slice(0, 7);

      console.log("Building report with params:", {
        accountId: currentAccountId,
        accountName: account.name,
        month,
        currencyCode,
      });

      const report = await buildBudgetReport({
        accountId: currentAccountId,
        accountName: account.name,
        currencyCode,
        month,
      });

      if (!report) {
        throw new Error("Report generation returned undefined");
      }

      console.log("Report generated:", report);

      // Try to get AI advice, but continue without it if unavailable
      let aiAdviceToExport = advice;
      if (!aiAdviceToExport) {
        try {
          const freshAdvice = await financeCoach.generateAdvice(report);
          aiAdviceToExport = freshAdvice;
        } catch (adviceError) {
          console.warn("Could not fetch AI advice for export, continuing without it:", adviceError);
          // Continue without AI advice
        }
      }

      await exportBudgetReportPdf({
        report,
        aiAdvice: aiAdviceToExport, // Include AI advice if available, undefined if not
      });

      trackEvent("budget_report_exported", {
        month,
        source: "coach_screen",
      });

      if (Platform.OS !== "web") {
        Alert.alert("Success", "Your budget report has been exported!");
      }
    } catch (error) {
      console.error("FAILED TO EXPORT BUDGET REPORT:", error);
      Alert.alert(
        "Export Failed",
        `Something went wrong while exporting your budget report: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setExporting(false);
    }
  };

  const loadLocal = useCallback(async () => {
    if (!currentAccountId) {
      setOverview(null);
      setInsights([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [overviewData, savingsGoals, profile] = await Promise.all([
        buildBudgetOverview(currentAccountId),
        getSavingsGoals(currentAccountId),
        (async () => {
          const { getProfile } = await import("../../onboarding/services/profileService");
          return getProfile();
        })(),
      ]);

      setOverview(overviewData);

      if (profile) {
        // Extract first name
        const firstName = profile.name.split(" ")[0];
        setUserName(firstName);
      }

      setInsights(
        buildDeterministicInsights({
          overview: overviewData,
          savingsGoals,
          currencyCode,
        }),
      );
    } catch (error) {
      console.error("FAILED TO LOAD COACH OVERVIEW:", error);
    } finally {
      setLoading(false);
    }
  }, [currentAccountId, currencyCode]);

  useFocusEffect(
    useCallback(() => {
      loadLocal();
    }, [loadLocal]),
  );

  const loadAdvice = useCallback(async () => {
    if (!currentAccountId) {
      return;
    }

    try {
      setAdviceLoading(true);
      setAdviceError(null);

      const context = await buildFinanceCoachContext(
        currentAccountId,
        currencyCode,
      );

      const response = await financeCoachProvider.generateAdvice(context);

      setAdvice(response.advice);
    } catch (error) {
      console.error("FAILED TO LOAD COACH ADVICE:", error);

      setAdviceError(
        error instanceof FinanceCoachError
          ? error.message
          : "Personalised advice needs an internet connection. Your insights above still work offline.",
      );
    } finally {
      setAdviceLoading(false);
    }
  }, [currentAccountId, currencyCode]);

  useEffect(() => {
    trackEvent("coach_opened");

    setAdvice(null);
    setAdviceError(null);

    loadAdvice();
  }, [loadAdvice]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Loading Dai Coach...
        </Text>
      </View>
    );
  }

  if (!currentAccountId || !overview) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No account selected</Text>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>
          Select an account to see your coaching insights.
        </Text>
      </View>
    );
  }

  const monthLabel = formatMonthLabel(overview.month);
  const period = getMonthPeriod(overview.month);
  const net = overview.incomeTotal - overview.expensesTotal;
  const format = (value: number) => formatCurrency(value, currencyCode);

  const attentionInsights = insights.filter(
    (insight) => insight.tone === "attention",
  );
  const positiveInsights = insights.filter(
    (insight) => insight.tone === "positive",
  );

  const todayDate = new Date().getDate().toString().padStart(2, "0");
  const monthDays = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate().toString().padStart(2, "0");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userName}</Text>
        <Text style={styles.headerTitle}>Today's Summary</Text>
      </View>

      {/* Date Stats */}
      <View style={styles.dateCard}>
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateNumber}>{todayDate}</Text>
            <Text style={styles.dateLabel}>Today</Text>
          </View>
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.dateNumber, { color: colors.textMuted }]}>
              {monthDays}
            </Text>
            <Text style={styles.dateLabel}>{monthLabel}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => router.push("/(tabs)/activity")}
            style={styles.calendarButton}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* AI Coach Session Card */}
      <View style={styles.coachCard}>
        <View style={styles.coachCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachName}>Dai Coach</Text>
            <Text style={styles.coachSubtitle}>Your Finance Assistant</Text>
          </View>
          {/* 3D Animated AI Avatar */}
          <AnimatedAIAvatar isThinking={adviceLoading} />
        </View>

        <View style={styles.sessionInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionLabel}>Monthly Review</Text>
            <Text style={styles.sessionValue}>{monthLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionLabel}>Days Remaining</Text>
            <Text style={styles.sessionValue}>
              {period.daysRemaining > 0 ? period.daysRemaining : 0}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.sessionButton}
          onPress={() => {
            // Scroll to AI insights below
          }}
        >
          <Text style={styles.sessionButtonText}>View AI Insights</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </Pressable>
      </View>

      {/* Progress Cards Grid with Animated Graphs */}
      <View style={styles.progressGrid}>
        <AnimatedProgressBar
          value={overview.incomeTotal}
          maxValue={overview.incomeTotal + overview.expensesTotal}
          color={colors.success}
          label="Income"
          subtext={monthLabel}
        />

        <AnimatedProgressBar
          value={overview.expensesTotal}
          maxValue={overview.incomeTotal + overview.expensesTotal}
          color={colors.error}
          label="Spent"
          subtext={monthLabel}
        />

        <AnimatedProgressBar
          value={Math.abs(net)}
          maxValue={overview.incomeTotal}
          color={net >= 0 ? colors.success : colors.error}
          label="Net"
          subtext={monthLabel}
        />

        <AnimatedProgressBar
          value={overview.categories.length}
          maxValue={10}
          color={colors.primary}
          label="Budget"
          subtext="Categories"
        />
      </View>

      {/* Needs Attention Section */}
      {attentionInsights.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>Needs Attention</Text>
          {attentionInsights.map((insight) => (
            <View key={insight.id} style={styles.insightItem}>
              <View style={[styles.insightDot, { backgroundColor: colors.error }]} />
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Doing Well Section */}
      {positiveInsights.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>You're Doing Well</Text>
          {positiveInsights.map((insight) => (
            <View key={insight.id} style={styles.insightItem}>
              <View style={[styles.insightDot, { backgroundColor: colors.success }]} />
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Insights Section */}
      <View style={styles.aiSection}>
        <View style={styles.aiSectionHeader}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.aiSectionTitle}>AI-Powered Insights</Text>
        </View>

        {adviceLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing your finances...</Text>
          </View>
        )}

        {!adviceLoading && !advice && adviceError && (
          <View>
            <Text style={styles.errorText}>{adviceError}</Text>
            <Pressable onPress={loadAdvice} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!adviceLoading && advice && (
          <View style={{ gap: 16 }}>
            {advice.whatWentWell.length > 0 && (
              <View>
                <Text style={styles.adviceGroupTitle}>What went well</Text>
                {advice.whatWentWell.map((item, idx) => (
                  <View key={idx} style={styles.adviceItem}>
                    <Text style={styles.adviceBullet}>•</Text>
                    <Text style={styles.adviceText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {advice.needsAttention.length > 0 && (
              <View>
                <Text style={styles.adviceGroupTitle}>What needs attention</Text>
                {advice.needsAttention.map((item, idx) => (
                  <View key={idx} style={styles.adviceItem}>
                    <Text style={styles.adviceBullet}>•</Text>
                    <Text style={styles.adviceText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {advice.suggestions.length > 0 && (
              <View>
                <Text style={styles.adviceGroupTitle}>Suggestions</Text>
                {advice.suggestions.map((item, idx) => (
                  <View key={idx} style={styles.adviceItem}>
                    <Text style={styles.adviceBullet}>•</Text>
                    <Text style={styles.adviceText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.disclaimer}>
              AI commentary on your aggregated Dai data — every figure shown is calculated by Dai itself.
            </Text>
          </View>
        )}
      </View>

      {/* Export Section */}
      <View style={styles.exportSection}>
        <Text style={styles.exportTitle}>Export Data</Text>
        <Text style={styles.exportSubtitle}>
          Download your financial data for backup or analysis
        </Text>

        <View style={styles.exportButtons}>
          <Pressable
            onPress={handleExportBudgetReport}
            disabled={exporting}
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.exportButtonTitle}>Budget Report</Text>
              <Text style={styles.exportButtonSubtext}>PDF • {monthLabel}</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </Pressable>

          <Pressable
            onPress={handleExportTransactions}
            disabled={exporting}
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.exportButtonTitle}>Transactions</Text>
              <Text style={styles.exportButtonSubtext}>CSV • All time</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {exporting && (
          <View style={styles.exportingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.exportingText}>Preparing export...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  dateCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 56,
  },
  dateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -4,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  coachCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  coachCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  coachName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  coachSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiAvatar: {
    width: 72,
    height: 72,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  aiGlowOuter: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B4A",
  },
  aiGlowMiddle: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF5533",
  },
  aiAvatarCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  aiShine: {
    position: "absolute",
    top: 8,
    left: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  aiShineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  sessionInfo: {
    flexDirection: "row",
    gap: 16,
  },
  sessionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sessionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginTop: 24,
  },
  sessionButtonText: {
    fontSize: 15,
    paddingLeft: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  progressCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  progressSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    borderRadius: 2,
  },
  insightSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  aiSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 0,
    // borderColor: colors.primary + "20",
  },
  aiSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  adviceGroupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  adviceItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  adviceBullet: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 8,
  },
  exportSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  exportSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  exportButtonSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  exportingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 12,
  },
  exportingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
