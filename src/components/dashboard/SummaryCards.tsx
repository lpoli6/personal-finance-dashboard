"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Luca";
  if (hour < 18) return "Good afternoon, Luca";
  return "Good evening, Luca";
}

function ChangeIndicator({ value, pct }: { value: number; pct: number }) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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
    <div className="space-y-6">
      {/* Hero: Greeting + Net Worth */}
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <p className="font-display text-4xl lg:text-5xl font-semibold tracking-tight mt-1">
          {formatGBP(summary.current.netWorth)}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <ChangeIndicator value={summary.momChange} pct={summary.momPct} />
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border-border/30 hover:scale-[1.01] transition-transform">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Month-on-Month</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">
              {formatGBP(Math.abs(summary.momChange))}
            </p>
            <ChangeIndicator value={summary.momChange} pct={summary.momPct} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/30 hover:scale-[1.01] transition-transform">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Year-on-Year</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">
              {formatGBP(Math.abs(summary.yoyChange))}
            </p>
            <ChangeIndicator value={summary.yoyChange} pct={summary.yoyPct} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/30 hover:scale-[1.01] transition-transform">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-xl font-semibold mt-1 tabular-nums">
              {formatGBP(summary.current.totalAssets)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Liabilities: {formatGBP(summary.current.totalLiabilities)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
