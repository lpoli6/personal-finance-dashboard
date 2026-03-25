import { format, startOfMonth } from "date-fns";

/**
 * Format a date for display as "MMM yyyy". e.g. 2025-03-01 → "Mar 2025"
 */
export function formatMonth(date: Date): string {
  return format(date, "MMM yyyy");
}

/**
 * Normalise any date to the 1st of its month. e.g. 2025-03-15 → 2025-03-01
 */
export function toMonthDate(date: Date): Date {
  return startOfMonth(date);
}
