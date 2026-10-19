import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PageBackButton } from "../../../components/PageBackButton";
import { LinearGradient } from "expo-linear-gradient";

import type { BudgetOverview } from "../../budget/services/budgetOverviewService";
import type { FinanceCoachAdvice } from "../../coach/types";
import type { Transaction } from "../../../types/transaction";

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
import { getTransactions } from "../../transactions/services/transactionService";
import { trackEvent } from "../../../services/analytics/analyticsService";

import { colors } from "../../../theme";
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
  const [topTransactions, setTopTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!currentAccountId) {
      setOverview(null);
      setTopTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await buildBudgetOverview(
        currentAccountId,
        selectedMonth,
      );

      setOverview(data);

      // Get top 5 expenses for the selected month
      const transactions = await getTransactions(currentAccountId);
      const monthTransactions = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.date.slice(0, 7) === selectedMonth
        )
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setTopTransactions(monthTransactions);
    } catch (error) {
      console.error("FAILED TO LOAD REPORT:", error);
      setOverview(null);
      setTopTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentAccountId, selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport]),
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

  const format = (value: number) => formatCurrency(value, currencyCode);

  const getStatusColor = (percent: number) => {
    if (percent >= 100) return colors.error;
    if (percent >= 80) return colors.warning;
    return colors.success;
  };

  const getCategoryStatusColor = (status: "healthy" | "warning" | "exceeded") => {
    switch (status) {
      case "exceeded":
        return colors.error;
      case "warning":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  if (!currentAccountId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
        <View
          style={{
            paddingTop: 16,
            paddingBottom: 20,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <PageBackButton onPress={() => router.back()} style={{ marginBottom: 0, marginLeft: 0 }} />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1a1a1a",
            }}
          >
            Budget Report
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            No account selected
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#999",
              textAlign: "center",
            }}
          >
            Select an account to view budget reports.
          </Text>
        </View>
      </View>
    );
  }

  const exportButtonLabel =
    Platform.OS === "web" ? "Print / Save as PDF" : "Generate PDF";

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 20,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <PageBackButton onPress={() => router.back()} style={{ marginBottom: 0, marginLeft: 0 }} />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#1a1a1a",
          }}
        >
          Budget Report
        </Text>

        <Pressable
          onPress={handleGenerate}
          disabled={exporting || !overview}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: exporting || !overview ? 0.5 : 1,
          }}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selection */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 20,
          }}
        >
          {REPORT_MONTHS.map((month) => {
            const selected = month === selectedMonth;

            return (
              <Pressable
                key={month}
                onPress={() => setSelectedMonth(month)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  backgroundColor: selected ? colors.secondary : "#F5F5F5",
                  borderWidth: selected ? 0 : 1,
                  borderColor: "#E8E5E0",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: selected ? "600" : "500",
                    color: selected ? colors.primary : "#666",
                  }}
                >
                  {formatMonthLabel(month)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View
            style={{
              paddingVertical: 60,
              alignItems: "center",
            }}
          >
            <ActivityIndicator color={colors.primary} />
            <Text
              style={{
                marginTop: 12,
                color: "#999",
                fontSize: 14,
              }}
            >
              Loading report...
            </Text>
          </View>
        ) : !overview ? (
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 60,
              alignItems: "center",
            }}
          >
            <Ionicons name="document-text-outline" size={48} color="#CCC" />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                fontWeight: "600",
                color: "#1a1a1a",
              }}
            >
              No data available
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#999",
                textAlign: "center",
              }}
            >
              Couldn't load report data for this month.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16, paddingHorizontal: 20 }}>
            {/* Summary Cards */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
              }}
            >
              {/* Income Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E8E5E0",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.success + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="trending-up"
                    size={20}
                    color={colors.success}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#999",
                    marginBottom: 4,
                  }}
                >
                  Income
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1a1a1a",
                  }}
                >
                  {format(overview.incomeTotal)}
                </Text>
              </View>

              {/* Expenses Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E8E5E0",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.error + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="trending-down"
                    size={20}
                    color={colors.error}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#999",
                    marginBottom: 4,
                  }}
                >
                  Expenses
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1a1a1a",
                  }}
                >
                  {format(overview.expensesTotal)}
                </Text>
              </View>
            </View>

            {/* Budget Health Card */}
            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#E8E5E0",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1a1a1a",
                  }}
                >
                  Budget Health
                </Text>
                {overview.totalBudgeted > 0 && (
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: getStatusColor(overview.utilisationPercent) + "15",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: getStatusColor(overview.utilisationPercent),
                      }}
                    >
                      {Math.round(overview.utilisationPercent)}%
                    </Text>
                  </View>
                )}
              </View>

              {overview.totalBudgeted > 0 ? (
                <>
                  {/* Progress Bar */}
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#F5F5F5",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(overview.utilisationPercent, 100)}%`,
                        height: "100%",
                        backgroundColor: getStatusColor(overview.utilisationPercent),
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#999" }}>
                      {format(overview.totalSpent)} spent
                    </Text>
                    <Text style={{ fontSize: 13, color: "#999" }}>
                      {format(overview.totalBudgeted)} budgeted
                    </Text>
                  </View>

                  {overview.expenseChangePercent !== null && (
                    <View
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: "#F5F5F5",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={
                          overview.expenseChangePercent >= 0
                            ? "arrow-up"
                            : "arrow-down"
                        }
                        size={16}
                        color={
                          overview.expenseChangePercent >= 0
                            ? colors.error
                            : colors.success
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          fontSize: 13,
                          color: "#666",
                        }}
                      >
                        {Math.abs(Math.round(overview.expenseChangePercent))}% vs
                        last month
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={{ fontSize: 14, color: "#999" }}>
                  No budget was set for this month.
                </Text>
              )}
            </View>

            {/* Category Breakdown */}
            {overview.categories.length > 0 && (
              <View
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E8E5E0",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: 16,
                  }}
                >
                  Category Breakdown
                </Text>

                {overview.categories
                  .sort((a, b) => b.spent - a.spent)
                  .map((category, index) => {
                    const statusColor = getCategoryStatusColor(category.status);

                    return (
                      <View
                        key={category.categoryId}
                        style={{
                          marginBottom: index < overview.categories.length - 1 ? 20 : 0,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "500",
                              color: "#1a1a1a",
                              flex: 1,
                            }}
                          >
                            {category.category}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: statusColor,
                              marginLeft: 8,
                            }}
                          >
                            {Math.round(category.percentage)}%
                          </Text>
                        </View>

                        {/* Progress Bar */}
                        <View
                          style={{
                            height: 6,
                            backgroundColor: "#F5F5F5",
                            borderRadius: 3,
                            overflow: "hidden",
                            marginBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              width: `${Math.min(category.percentage, 100)}%`,
                              height: "100%",
                              backgroundColor: statusColor,
                            }}
                          />
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text style={{ fontSize: 12, color: "#999" }}>
                            {format(category.spent)} / {format(category.budgeted)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: category.remaining >= 0 ? colors.success : colors.error,
                            }}
                          >
                            {category.remaining >= 0 ? format(category.remaining) : format(Math.abs(category.remaining))} {category.remaining >= 0 ? "left" : "over"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* Top Expenses */}
            {topTransactions.length > 0 && (
              <View
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E8E5E0",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: 16,
                  }}
                >
                  Top 5 Expenses
                </Text>

                {topTransactions.map((transaction, index) => (
                  <Pressable
                    key={transaction.id}
                    onPress={() => router.push(`/transaction/${transaction.id}`)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: index < topTransactions.length - 1 ? 1 : 0,
                      borderBottomColor: "#F5F5F5",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#F5F5F5",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#666",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: "#1a1a1a",
                          marginBottom: 2,
                        }}
                      >
                        {transaction.description || transaction.category}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#999",
                        }}
                      >
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.error,
                        marginLeft: 12,
                      }}
                    >
                      {format(transaction.amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Export Section */}
            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#E8E5E0",
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1a1a1a",
                  }}
                >
                  Export Report
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: "#666",
                  lineHeight: 20,
                  marginBottom: 16,
                }}
              >
                Generate a shareable PDF report with Dai Coach insights{" "}
                {selectedMonth === REPORT_MONTHS[0] && "and personalized recommendations"}.
              </Text>

              {exportError && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.error,
                    marginBottom: 16,
                  }}
                >
                  {exportError}
                </Text>
              )}

              <Pressable
                onPress={handleGenerate}
                disabled={exporting}
                style={{
                  backgroundColor: exporting ? "#F5F5F5" : colors.secondary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {exporting ? (
                  <>
                    <ActivityIndicator size="small" color="#999" />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#999",
                      }}
                    >
                      Preparing report...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color={colors.primary} />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.primary,
                      }}
                    >
                      {exportButtonLabel}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
