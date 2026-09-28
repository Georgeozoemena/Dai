import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "expo-router";

import type { BudgetOverview } from "../../budget/services/budgetOverviewService";
import type { FinanceCoachAdvice } from "../../coach/types";

import { useAccountStore } from "../../../store/account/accountStore";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

import { buildBudgetOverview } from "../../budget/services/budgetOverviewService";
import { formatMonthLabel } from "../../budget/services/monthUtils";
import { buildFinanceCoachContext } from "../../coach/services/financeContextBuilder";
import { financeCoachProvider } from "../../coach/services/financeCoachProvider";

import {
  buildBudgetReport,
  getRecentMonths,
} from "../services/budgetReportService";
import { exportBudgetReportPdf } from "../services/reportPdfService";

import { getAccount } from "../../../services/accountService";
import { trackEvent } from "../../../services/analytics/analyticsService";

import { colors, screenStyles } from "../../../theme";
import { formatCurrency } from "../../../utils/currency";

const REPORT_MONTHS = getRecentMonths(6);

/**
 * Bounds how long the report waits for AI commentary. The PDF must never
 * depend on the AI call — past this point the deterministic observations
 * are used instead.
 */
const REPORT_ADVICE_TIMEOUT_MS = 8000;

export function BudgetReportScreen() {
  const currentAccountId = useAccountStore((state) => state.currentAccountId);
  const currencyCode = useAccountCurrency();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    () => REPORT_MONTHS[0] ?? "",
  );
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!currentAccountId) {
      setOverview(null);
      setPreviewLoading(false);
      return;
    }

    try {
      setPreviewLoading(true);

      const data = await buildBudgetOverview(
        currentAccountId,
        selectedMonth,
      );

      setOverview(data);
    } catch (error) {
      console.error("FAILED TO LOAD REPORT PREVIEW:", error);
      setOverview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [currentAccountId, selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadPreview();
    }, [loadPreview]),
  );

  const handleGenerate = async () => {
    if (!currentAccountId || exporting) {
      return;
    }

    try {
      setExporting(true);
      setExportError(null);

      const account = await getAccount(currentAccountId);

      const report = await buildBudgetReport({
        accountId: currentAccountId,
        accountName: account?.name ?? "Dai Account",
        currencyCode,
        month: selectedMonth,
      });

      // Personalised review is only requested for the current month; the
      // report always generates without it.
      let aiAdvice: FinanceCoachAdvice | null = null;

      if (selectedMonth === REPORT_MONTHS[0]) {
        const advicePromise = (async (): Promise<FinanceCoachAdvice | null> => {
          try {
            const context = await buildFinanceCoachContext(
              currentAccountId,
              currencyCode,
              selectedMonth,
            );

            const response =
              await financeCoachProvider.generateAdvice(context);

            return response.advice;
          } catch (error) {
            console.error("COACH ADVICE UNAVAILABLE FOR REPORT:", error);
            return null;
          }
        })();

        const timeout = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), REPORT_ADVICE_TIMEOUT_MS);
        });

        aiAdvice = await Promise.race([advicePromise, timeout]);
      }

      await exportBudgetReportPdf({ report, aiAdvice });

      trackEvent("report_generated");
    } catch (error) {
      console.error("FAILED TO EXPORT BUDGET REPORT:", error);
      setExportError("Couldn't generate the report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!currentAccountId) {
    return (
      <View style={screenStyles.centered}>
        <Text style={screenStyles.title}>No account selected</Text>

        <Text style={[screenStyles.subtitle, { textAlign: "center" }]}>
          Select an account to build a budget report.
        </Text>
      </View>
    );
  }

  const format = (value: number) => formatCurrency(value, currencyCode);

  const exportButtonLabel =
    Platform.OS === "web" ? "Print / Save as PDF" : "Generate PDF";

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Budget Report</Text>

        <Text style={screenStyles.subtitle}>
          A shareable summary of your monthly budget.
        </Text>
      </View>

      {/* Month selection */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {REPORT_MONTHS.map((month) => {
          const selected = month === selectedMonth;

          return (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={screenStyles.filterPill(selected)}
            >
              <Text style={screenStyles.filterPillText(selected)}>
                {formatMonthLabel(month)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Preview */}
      <View style={[screenStyles.card, { gap: 14 }]}>
        {previewLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <ActivityIndicator color={colors.secondary} />
          </View>
        ) : overview ? (
          <>
            <Text style={screenStyles.sectionTitle}>
              {formatMonthLabel(selectedMonth)}
            </Text>

            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Income
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {format(overview.incomeTotal)}
                </Text>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Spent
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {format(overview.expensesTotal)}
                </Text>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Budget used
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color:
                      overview.utilisationPercent >= 100
                        ? colors.error
                        : overview.utilisationPercent >= 80
                          ? colors.warning
                          : colors.success,
                  }}
                >
                  {overview.totalBudgeted > 0
                    ? `${Math.round(overview.utilisationPercent)}%`
                    : "—"}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              {overview.totalBudgeted > 0
                ? `${format(overview.totalSpent)} of ${format(
                    overview.totalBudgeted,
                  )} budget allocated.`
                : "No budget was set for this month."}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary }}>
            Couldn't load data for this month.
          </Text>
        )}
      </View>

      {exportError && (
        <Text style={{ color: colors.error }}>{exportError}</Text>
      )}

      <Pressable onPress={handleGenerate} style={screenStyles.primaryButton}>
        <Text style={screenStyles.primaryButtonText}>
          {exporting ? "Preparing report..." : exportButtonLabel}
        </Text>
      </Pressable>

      <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
        The report includes a Dai Coach review when you're online. Offline, it
        still generates with your calculated observations.
      </Text>
    </ScrollView>
  );
}
