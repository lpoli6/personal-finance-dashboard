import { format, parseISO } from "date-fns";
import type { TransactionWithCategory } from "@/types";

/**
 * Returns array of { name, value } for donut chart — group by category name, debits only, exclude transfers.
 * Value is in pence. Sorted descending by value.
 */
export function spendingByCategory(
  transactions: TransactionWithCategory[]
): { name: string; value: number }[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    if (t.is_excluded) continue;
    if (t.transaction_categories?.type === "transfer") continue;

    const name = t.transaction_categories?.name ?? "Uncategorised";
    totals.set(name, (totals.get(name) ?? 0) + t.amount_pence);
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Returns array of { month, total } for monthly bar chart — debits only, exclude transfers.
 * Month formatted as "MMM yyyy". Total is in pence. Sorted chronologically.
 */
export function monthlySpending(
  transactions: TransactionWithCategory[]
): { month: string; total: number }[] {
  const totals = new Map<string, { sortKey: string; total: number }>();

  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    if (t.is_excluded) continue;
    if (t.transaction_categories?.type === "transfer") continue;

    const date = parseISO(t.date);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMM yyyy");

    const existing = totals.get(monthKey);
    if (existing) {
      existing.total += t.amount_pence;
    } else {
      totals.set(monthKey, { sortKey: monthKey, total: t.amount_pence });
    }
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { total }]) => {
      const [year, month] = key.split("-");
      const label = format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMM yyyy");
      return { month: label, total };
    });
}

/**
 * Returns top N merchants by total debit spend.
 * Excludes transfers and excluded transactions. Sorted descending by total.
 */
export function topMerchants(
  transactions: TransactionWithCategory[],
  limit: number = 10
): { merchant: string; total: number; count: number }[] {
  const merchants = new Map<string, { total: number; count: number }>();

  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    if (t.is_excluded) continue;
    if (t.transaction_categories?.type === "transfer") continue;

    const name = t.description.trim();
    if (!name) continue;

    const existing = merchants.get(name);
    if (existing) {
      existing.total += t.amount_pence;
      existing.count += 1;
    } else {
      merchants.set(name, { total: t.amount_pence, count: 1 });
    }
  }

  return Array.from(merchants.entries())
    .map(([merchant, { total, count }]) => ({ merchant, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
