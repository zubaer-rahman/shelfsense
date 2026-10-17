const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";

/**
 * Format a number or string as a currency string.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "$0.00";
  }
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format an integer or float with thousand separators.
 */
export function formatNumber(
  value: number | string | null | undefined,
  maximumFractionDigits: number = 0,
): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0";
  }
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(numericValue);
}

/**
 * Format a date string or Date object to a human-readable local date.
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(d);
}

/**
 * Format a date string or Date object to include local time.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format movement signed quantity (+10, -5).
 */
export function formatSignedQuantity(quantity: number): string {
  if (quantity > 0) return `+${formatNumber(quantity)}`;
  return formatNumber(quantity);
}
