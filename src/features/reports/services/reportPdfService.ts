import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { FinanceCoachAdvice } from "../../coach/types";
import type { BudgetReport, BudgetReportStatus } from "./budgetReportService";

import { formatCurrency } from "../../../utils/currency";

export interface BudgetReportPdfInput {
  report: BudgetReport;
  aiAdvice?: FinanceCoachAdvice | null;
}

const STATUS_LABELS: Record<BudgetReportStatus, string> = {
  on_track: "On Track",
  approaching: "Approaching Limit",
  exceeded: "Exceeded",
};

const STATUS_COLORS: Record<BudgetReportStatus, string> = {
  on_track: "#1a9c4b",
  approaching: "#e6a700",
  exceeded: "#d00000",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(amount: number, currencyCode: string): string {
  return escapeHtml(formatCurrency(amount, currencyCode));
}

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

function buildHighlights(report: BudgetReport): string[] {
  const highlights: string[] = [];
  const totalBudgets =
    report.highlights.budgetsWithinTarget +
    report.highlights.budgetsApproaching +
    report.highlights.budgetsExceeded;

  if (totalBudgets > 0) {
    highlights.push(
      `${report.highlights.budgetsWithinTarget} of ${totalBudgets} budgets within target.`,
    );

    if (report.highlights.budgetsExceeded > 0) {
      highlights.push(
        `${report.highlights.budgetsExceeded} ${
          report.highlights.budgetsExceeded === 1 ? "budget has" : "budgets have"
        } been exceeded.`,
      );
    }

    if (report.highlights.budgetsApproaching > 0) {
      highlights.push(
        `${report.highlights.budgetsApproaching} ${
          report.highlights.budgetsApproaching === 1 ? "budget is" : "budgets are"
        } approaching the limit.`,
      );
    }
  } else {
    highlights.push("No budget was set for this period.");
  }

  if (report.highlights.largestCategory) {
    highlights.push(
      `Largest spending category: ${report.highlights.largestCategory.category} (${money(
        report.highlights.largestCategory.total,
        report.currency,
      )}).`,
    );
  }

  if (
    report.highlights.expenseChangePercent !== null &&
    report.overview.expensesTotal > 0
  ) {
    const change = Math.round(
      Math.abs(report.highlights.expenseChangePercent),
    );
    const direction =
      report.highlights.expenseChangePercent >= 0 ? "higher" : "lower";

    highlights.push(
      `Spending is ${change}% ${direction} than ${report.previousMonthLabel}.`,
    );
  }

  if (report.savings.target > 0) {
    highlights.push(
      `Savings progress: ${money(
        report.savings.current,
        report.currency,
      )} of ${money(report.savings.target, report.currency)} (${percent(
        report.savings.progressPercent,
      )}).`,
    );
  }

  return highlights;
}

function buildBulletList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function buildCoachSection(
  report: BudgetReport,
  aiAdvice: FinanceCoachAdvice | null,
): string {
  if (
    aiAdvice &&
    (aiAdvice.whatWentWell.length > 0 ||
      aiAdvice.needsAttention.length > 0 ||
      aiAdvice.suggestions.length > 0)
  ) {
    return `
      <div class="coach-group">
        <h3>What went well</h3>
        ${buildBulletList(aiAdvice.whatWentWell)}
      </div>
      <div class="coach-group">
        <h3>What needs attention</h3>
        ${buildBulletList(aiAdvice.needsAttention)}
      </div>
      <div class="coach-group">
        <h3>Suggestions for the period ahead</h3>
        ${buildBulletList(aiAdvice.suggestions)}
      </div>
      <p class="ai-note">
        AI-generated commentary based on your aggregated Dai data. All figures
        in this report are calculated by Dai itself.
      </p>
    `;
  }

  return `
    ${buildBulletList(report.observations)}
    <p class="ai-note">
      Personalised AI commentary was unavailable when this report was
      generated. The observations above are calculated by Dai from your own
      data.
    </p>
  `;
}

export function buildBudgetReportHtml({
  report,
  aiAdvice,
}: BudgetReportPdfInput): string {
  const generatedLabel = escapeHtml(
    new Date(report.generatedAt).toLocaleString(),
  );

  const overviewStats = [
    { label: "Total Income", value: money(report.overview.incomeTotal, report.currency) },
    { label: "Total Expenses", value: money(report.overview.expensesTotal, report.currency) },
    { label: "Budget Allocated", value: money(report.overview.totalBudgeted, report.currency) },
    { label: "Budget Remaining", value: money(report.overview.totalRemaining, report.currency) },
  ];

  const budgetRows = report.categories
    .map(
      (category) => `
        <tr>
          <td>${escapeHtml(category.category)}</td>
          <td class="num">${money(category.allocated, report.currency)}</td>
          <td class="num">${money(category.spent, report.currency)}</td>
          <td class="num" style="color: ${
            category.remaining < 0 ? "#d00000" : "#1a9c4b"
          }">${money(category.remaining, report.currency)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          @page { margin: 0; }

          body {
            font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
            color: #120E01;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.6;
          }

          .hero-image {
            width: 100%;
            height: 280px;
            object-fit: cover;
            border-radius: 0 0 24px 24px;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }

          .content {
            padding: 40px 60px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }

          .brand-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .brand-icon {
            width: 40px;
            height: 40px;
            background: #120E01;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 800;
            color: #FBCC33;
          }

          .brand-text h1 {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          .report-number {
            text-align: right;
            color: #666666;
            font-size: 13px;
          }

          .report-number .number {
            font-weight: 600;
            color: #120E01;
            margin-top: 4px;
            display: block;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }

          .info-block h3 {
            font-size: 11px;
            color: #999999;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          }

          .info-block p {
            font-size: 15px;
            font-weight: 600;
            color: #120E01;
            line-height: 1.4;
          }

          .info-block .date {
            font-size: 13px;
            color: #666666;
            margin-top: 2px;
          }

          .section-title {
            font-size: 13px;
            color: #999999;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 40px 0 16px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }

          .stat-card {
            background: #F8F8F8;
            padding: 20px;
            border-radius: 12px;
          }

          .stat-card .label {
            font-size: 12px;
            color: #666666;
            margin-bottom: 8px;
          }

          .stat-card .value {
            font-size: 20px;
            font-weight: 700;
            color: #120E01;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }

          thead {
            border-bottom: 2px solid #F3F3F3;
          }

          th {
            text-align: left;
            padding: 12px 8px;
            font-size: 11px;
            color: #999999;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 600;
          }

          td {
            padding: 16px 8px;
            border-bottom: 1px solid #F8F8F8;
            font-size: 14px;
          }

          .num {
            text-align: right;
            font-weight: 600;
          }

          .totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
            gap: 100px;
          }

          .totals .total-line {
            display: flex;
            justify-content: space-between;
            min-width: 280px;
            padding: 12px 0;
          }

          .totals .total-line.final {
            border-top: 2px solid #120E01;
            font-size: 18px;
            font-weight: 700;
            padding-top: 16px;
          }

          .coach-section {
            background: #FFFBF0;
            border: 2px solid #FBCC33;
            border-radius: 16px;
            padding: 30px;
            margin: 40px 0;
          }

          .coach-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }

          .coach-icon {
            font-size: 20px;
          }

          .coach-title {
            font-size: 18px;
            font-weight: 700;
            color: #120E01;
          }

          .coach-group {
            margin-bottom: 20px;
          }

          .coach-group h3 {
            font-size: 14px;
            font-weight: 600;
            color: #120E01;
            margin-bottom: 10px;
          }

          ul {
            list-style: none;
            padding-left: 0;
          }

          li {
            padding-left: 20px;
            position: relative;
            margin-bottom: 8px;
            line-height: 1.6;
          }

          li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #FBCC33;
            font-weight: 700;
          }

          .ai-note {
            font-size: 12px;
            color: #999999;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #F3F3F3;
          }

          .footer {
            text-align: center;
            padding: 30px 60px;
            color: #999999;
            font-size: 12px;
            border-top: 1px solid #F3F3F3;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <!-- Hero Image -->
          <img src="file:///Users/mac/Documents/Dai/assets/old-man.jpg" class="hero-image" alt="Dai Finance" />

          <div class="content">
            <!-- Header -->
            <div class="header">
              <div class="brand-section">
                <div class="brand-icon">D</div>
                <div class="brand-text">
                  <h1>BUDGET REPORT</h1>
                </div>
              </div>
              <div class="report-number">
                <div>${escapeHtml(report.monthLabel)}</div>
                <span class="number">#${report.month.replace(/-/g, "")}</span>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              <div class="info-block">
                <h3>ACCOUNT</h3>
                <p>${escapeHtml(report.accountName)}</p>
              </div>
              <div class="info-block">
                <h3>ISSUED</h3>
                <p>${generatedLabel.split(",")[0]}</p>
                <div class="date">${generatedLabel.split(",")[1]}</div>
              </div>
              <div class="info-block">
                <h3>CURRENCY</h3>
                <p>${escapeHtml(report.currency)}</p>
              </div>
            </div>

            <!-- Overview Stats -->
            <div class="section-title">FINANCIAL OVERVIEW</div>
            <div class="stats-grid">
              ${overviewStats
                .map(
                  (stat) => `
                    <div class="stat-card">
                      <div class="label">${stat.label}</div>
                      <div class="value">${stat.value}</div>
                    </div>
                  `,
                )
                .join("")}
            </div>

            <!-- Budget Table -->
            <div class="section-title">BUDGET BREAKDOWN</div>
            <table>
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th class="num">ALLOCATED</th>
                  <th class="num">SPENT</th>
                  <th class="num">REMAINING</th>
                </tr>
              </thead>
              <tbody>
                ${budgetRows}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
              <div class="total-line">
                <span>Subtotal</span>
                <span>${money(report.overview.expensesTotal, report.currency)}</span>
              </div>
            </div>
            <div class="totals">
              <div class="total-line final">
                <span>Total Budget Used</span>
                <span>${money(report.overview.expensesTotal, report.currency)}</span>
              </div>
            </div>

            <!-- AI Coach Section -->
            <div class="coach-section">
              <div class="coach-header">
                <span class="coach-icon">✨</span>
                <span class="coach-title">Dai Coach Insights</span>
              </div>
              ${buildCoachSection(report, aiAdvice)}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            Thank you for using Dai to manage your finances!
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate and share the budget report PDF.
 *
 * Native: renders the HTML to a PDF file and opens the system share sheet
 * (same pattern as the CSV export). Web: opens the report in its own window
 * and triggers the browser print dialog, where the user can save it as a PDF.
 */
export async function exportBudgetReportPdf(
  input: BudgetReportPdfInput,
): Promise<void> {
  const html = buildBudgetReportHtml(input);

  if (Platform.OS === "web") {
    // expo-print's `html` option targets Android/iOS only; on web it would
    // print the current app page instead. Render the report in its own
    // window so the browser print dialog produces the report itself.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Allow pop-ups for this site to save the report as a PDF.",
      );
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Dai Budget Report",
    UTI: "com.adobe.pdf",
  });
}
