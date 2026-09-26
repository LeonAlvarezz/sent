export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats a number as a localized currency string.
 * @default currency = "USD", locale = "en-US"
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {},
): string {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export interface FormatNumberOptions {
  locale?: string;
  notation?: "standard" | "compact" | "scientific" | "engineering";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats a number with localized thousands separators and optional notation (e.g. 1.2K).
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {},
): string {
  const {
    locale = "en-US",
    notation = "standard",
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  return new Intl.NumberFormat(locale, {
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats a date, timestamp, or ISO string using Intl.DateTimeFormat.
 * @default format = "MMM d, yyyy"
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale = "en-US",
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Formats a date into a human-readable relative time (e.g., "5 minutes ago", "in 2 days").
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date(),
  locale = "en-US",
): string {
  const target = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(target.getTime())) return "Invalid Date";

  const diffInSeconds = Math.round((target.getTime() - baseDate.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const cutoffs = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ] as const;

  for (const { unit, seconds } of cutoffs) {
    if (Math.abs(diffInSeconds) >= seconds || unit === "minute") {
      const value = Math.round(diffInSeconds / seconds);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(diffInSeconds, "second");
}

/**
 * Formats bytes into a human-readable file size string (e.g. "1.5 MB").
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  if (bytes < 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedIndex = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, clampedIndex)).toFixed(dm))} ${sizes[clampedIndex]}`;
}
