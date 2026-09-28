/**
 * Month-string helpers for Dai's "YYYY-MM" budget periods.
 *
 * Kept dependency-free so every calculation layer (warnings, insights,
 * reports) can reuse them without pulling in data-access modules.
 */

export function getPreviousMonth(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const previous = new Date(year, monthIndex - 2, 1);

  const previousYear = previous.getFullYear();
  const previousMonthIndex = String(previous.getMonth() + 1).padStart(2, "0");

  return `${previousYear}-${previousMonthIndex}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Turn a "YYYY-MM" month string into a readable label like "September 2026". */
export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    return month;
  }

  return `${MONTH_NAMES[monthIndex - 1]} ${year}`;
}
