"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

function ChangeIndicator({ value, pct }: { value: number; pct: number }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{formatGBP(Math.abs(value))}</span>
      <span className="text-muted-foreground">({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="col-span-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className="text-3xl font-bold tracking-tight mt-1">
            {formatGBP(summary.current.netWorth)}
          </p>
          <div className="mt-2">
            <ChangeIndicator value={summary.momChange} pct={summary.momPct} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Month-on-Month</p>
          <p className="text-xl font-semibold mt-1">
            {formatGBP(Math.abs(summary.momChange))}
          </p>
          <ChangeIndicator value={summary.momChange} pct={summary.momPct} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Year-on-Year</p>
          <p className="text-xl font-semibold mt-1">
            {formatGBP(Math.abs(summary.yoyChange))}
          </p>
          <ChangeIndicator value={summary.yoyChange} pct={summary.yoyPct} />
        </CardContent>
      </Card>
    </div>
  );
}
