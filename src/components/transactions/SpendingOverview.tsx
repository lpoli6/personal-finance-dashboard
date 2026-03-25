"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import {
  spendingByCategory,
  monthlySpending,
  topMerchants,
} from "@/lib/utils/transaction-analysis";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { MonthlySpendingChart } from "./MonthlySpendingChart";
import { TopMerchantsTable } from "./TopMerchantsTable";
import type { TransactionWithCategory } from "@/types";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface SpendingOverviewProps {
  transactions: TransactionWithCategory[];
}

export function SpendingOverview({ transactions }: SpendingOverviewProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Import a statement to see spending analysis.
      </div>
    );
  }

  const categoryData = useMemo(() => spendingByCategory(transactions), [transactions]);
  const monthlyData = useMemo(() => monthlySpending(transactions), [transactions]);
  const merchantData = useMemo(() => topMerchants(transactions, 10), [transactions]);

  // Compute summary stats for the current month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthTransactions = transactions.filter((t) => {
    if (t.direction !== "debit") return false;
    if (t.is_excluded) return false;
    if (t.transaction_categories?.type === "transfer") return false;
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const totalSpendThisMonth = thisMonthTransactions.reduce(
    (sum, t) => sum + t.amount_pence,
    0
  );
  const transactionCount = thisMonthTransactions.length;
  const avgTransaction =
    transactionCount > 0 ? Math.round(totalSpendThisMonth / transactionCount) : 0;

  // Top category this month
  const catTotals = new Map<string, number>();
  for (const t of thisMonthTransactions) {
    const name = t.transaction_categories?.name ?? "Uncategorised";
    catTotals.set(name, (catTotals.get(name) ?? 0) + t.amount_pence);
  }
  let topCategoryName = "None";
  let topCategoryTotal = 0;
  for (const [name, total] of catTotals) {
    if (total > topCategoryTotal) {
      topCategoryName = name;
      topCategoryTotal = total;
    }
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Spend This Month</p>
            <p className="text-2xl font-bold mt-1">{formatGBP(totalSpendThisMonth)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(now, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Transaction</p>
            <p className="text-2xl font-bold mt-1">{formatGBP(avgTransaction)}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold mt-1">{transactionCount}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Category</p>
            <p className="text-lg font-bold mt-1">{topCategoryName}</p>
            <p className="text-sm text-muted-foreground">
              {topCategoryTotal > 0 ? formatGBP(topCategoryTotal) : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryDonutChart data={categoryData} />
        <MonthlySpendingChart data={monthlyData} />
      </div>

      {/* Row 3: Top merchants table */}
      <TopMerchantsTable data={merchantData} />
    </div>
  );
}
