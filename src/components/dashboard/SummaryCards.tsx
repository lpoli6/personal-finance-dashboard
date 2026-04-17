"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Flame, Target, Landmark, Coins } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { DashboardSummary, NetWorthChartPoint } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary;
  chartData: NetWorthChartPoint[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up, Luca";
  if (hour < 12) return "Good morning, Luca";
  if (hour < 18) return "Good afternoon, Luca";
  return "Good evening, Luca";
}

function formatCompact(pence: number): string {
  const p = pence / 100;
  const abs = Math.abs(p);
  if (abs >= 1_000_000) return `£${(p / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `£${(p / 1_000).toFixed(0)}k`;
  return `£${p.toFixed(0)}`;
}

function Delta({
  value,
  pct,
  size = "sm",
}: {
  value: number;
  pct: number;
  size?: "sm" | "md";
}) {
  const isPositive = value >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-medium tabular-nums",
        size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5",
        isPositive
          ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-500 dark:text-rose-400"
      )}
    >
      <Icon className={cn(size === "md" ? "h-3.5 w-3.5" : "h-3 w-3")} />
      {isPositive ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-card/40 p-5 transition-colors hover:bg-card/70">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            accent ?? "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sublabel && <div className="mt-1.5 text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

export function SummaryCards({ summary, chartData }: SummaryCardsProps) {
  const { current, momChange, momPct, yoyChange, yoyPct } = summary;
  const isPositiveMom = momChange >= 0;
  const sparkData = chartData.slice(-12);

  // ROI on liquid investments (ISA + GIA + Pension)
  const liquidInvestable =
    current.isaTotal + current.investmentTotal + current.pensionTotal;

  // "Freedom number" — very rough: 25× annual spend. Here we don't know annual
  // spend yet, so we show liquid-investable as a percentage of £1M milestone.
  const milestone = 1_000_000_00; // £1M in pence
  const freedomPct = Math.min(100, (current.netWorth / milestone) * 100);

  return (
    <div className="space-y-6">
      {/* Hero block */}
      <div className="hero-ring mesh-accent relative overflow-hidden rounded-2xl bg-card/40 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{getGreeting()}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500 mt-3">
              Net worth
            </p>
            <p className="rise font-display text-5xl lg:text-6xl font-semibold tracking-tight mt-1 tabular-nums glow-accent">
              {formatGBP(current.netWorth)}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <Delta value={momChange} pct={momPct} size="md" />
              <span className="text-sm text-muted-foreground tabular-nums">
                {isPositiveMom ? "+" : ""}
                {formatGBP(momChange)}
              </span>
              <span className="text-xs text-muted-foreground/80">vs last month</span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-24 w-full lg:w-72 -mb-2 -mr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#heroSpark)"
                  isAnimationActive
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Freedom progress */}
        <div className="mt-7 pt-6 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">
              Road to <span className="text-foreground font-medium">£1M</span>
            </span>
            <span className="tabular-nums font-medium text-emerald-500">
              {freedomPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-400 transition-all duration-700"
              style={{ width: `${freedomPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiTile
          icon={Coins}
          label="Total Assets"
          value={formatGBP(current.totalAssets)}
          sublabel={
            <span>
              Liquid{" "}
              <span className="tabular-nums text-foreground/80 font-medium">
                {formatCompact(liquidInvestable)}
              </span>
            </span>
          }
          accent="bg-emerald-500/10 text-emerald-500"
        />
        <KpiTile
          icon={Landmark}
          label="Liabilities"
          value={formatGBP(current.totalLiabilities)}
          sublabel={
            <span>
              Ratio{" "}
              <span className="tabular-nums text-foreground/80 font-medium">
                {current.totalAssets > 0
                  ? ((current.totalLiabilities / current.totalAssets) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </span>
          }
          accent="bg-rose-500/10 text-rose-500"
        />
        <KpiTile
          icon={Flame}
          label="MoM change"
          value={`${isPositiveMom ? "+" : ""}${formatGBP(momChange)}`}
          sublabel={<Delta value={momChange} pct={momPct} />}
          accent="bg-amber-500/10 text-amber-500"
        />
        <KpiTile
          icon={Target}
          label="YoY change"
          value={`${yoyChange >= 0 ? "+" : ""}${formatGBP(yoyChange)}`}
          sublabel={<Delta value={yoyChange} pct={yoyPct} />}
          accent="bg-indigo-500/10 text-indigo-400"
        />
      </div>
    </div>
  );
}
