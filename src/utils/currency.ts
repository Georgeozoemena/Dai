import { CURRENCIES } from "../constants/currencies";

/**
 * Format amount with currency symbol
 * @param amount - The numeric amount to format
 * @param currencyCode - Currency code (NGN, USD, EUR, GBP)
 * @param showDecimals - Whether to show decimal places (default: false for whole numbers)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "NGN",
  showDecimals: boolean = false
): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol ?? currencyCode;

  // Format with thousands separators
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  const formattedAmount = formatter.format(Math.abs(amount));

  return `${symbol}${formattedAmount}`;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.symbol ?? currencyCode;
}

/**
 * Get currency name for a currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.name ?? currencyCode;
}
