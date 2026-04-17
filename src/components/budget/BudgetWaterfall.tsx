"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { BudgetItem } from "@/types";

interface BudgetWaterfallProps {
  items: BudgetItem[];
}

const BANDS = [
  { key: "fixed", label: "Fixed costs", color: "#f43f5e", tint: "bg-rose-500/10 text-rose-400" },
  { key: "savings", label: "Savings", color: "#6366f1", tint: "bg-indigo-500/10 text-indigo-400" },
  { key: "discretionary", label: "Discretionary", color: "#f59e0b", tint: "bg-amber-500/10 text-amber-400" },
] as const;

export function BudgetWaterfall({ items }: BudgetWaterfallProps) {
  const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount_pence, 0);
  const fixed = items.filter((i) => i.type === "fixed").reduce((s, i) => s + i.amount_pence, 0);
  const savings = items.filter((i) => i.type === "savings").reduce((s, i) => s + i.amount_pence, 0);
  const discretionary = Math.max(0, income - fixed - savings);

  const total = fixed + savings + discretionary;
  const pct = (v: number) => (total ? (v / total) * 100 : 0);

  const forcedSavingsRate = income ? (savings / income) * 100 : 0;
  const fixedRate = income ? (fixed / income) * 100 : 0;

  const pieData = [
    { name: "Fixed costs", value: fixed, color: "#f43f5e" },
    { name: "Savings", value: savings, color: "#6366f1" },
    { name: "Discretionary", value: discretionary, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Hero summary strip */}
      <div className="hero-ring mesh-accent relative overflow-hidden rounded-2xl bg-card/40 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500">
              Monthly budget
            </p>
            <p className="rise font-display text-5xl lg:text-6xl font-semibold tabular-nums mt-1 glow-accent">
              {formatGBP(income)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              take-home · allocated across fixed, savings, and discretionary
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Savings rate
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5 text-indigo-400">
                {forcedSavingsRate.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fixed ratio
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5 text-rose-400">
                {fixedRate.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Left over
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5 text-amber-400">
                {formatGBP(discretionary)}
              </p>
            </div>
          </div>
        </div>

        {/* Stacked allocation bar */}
        <div className="mt-7 pt-6 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Allocation of every £1 earned</span>
            <span className="tabular-nums">{formatGBP(total)} / {formatGBP(income)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            {BANDS.map((b) => {
              const v = b.key === "fixed" ? fixed : b.key === "savings" ? savings : discretionary;
              const p = pct(v);
              if (p <= 0) return null;
              return (
                <div
                  key={b.key}
                  style={{ width: `${p}%`, background: b.color }}
                  className="h-full transition-all duration-700"
                  title={`${b.label}: ${formatGBP(v)}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {BANDS.map((b) => {
              const v = b.key === "fixed" ? fixed : b.key === "savings" ? savings : discretionary;
              return (
                <span
                  key={b.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 pl-2 pr-2.5 py-1"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                  <span className="text-[11px] font-medium text-muted-foreground">{b.label}</span>
                  <span className="text-[11px] font-semibold tabular-nums">
                    {formatGBP(v)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Allocation donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Cash-flow narrative
          </p>
          <div className="mt-4 space-y-3">
            <FlowRow label="Take-home pay" value={income} color="#10b981" />
            <FlowRow label="− Fixed costs" value={-fixed} color="#f43f5e" />
            <FlowRow label="− Savings transfers" value={-savings} color="#6366f1" />
            <div className="border-t border-border pt-3">
              <FlowRow label="= Discretionary" value={discretionary} color="#f59e0b" bold />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col items-center justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground self-start">
            Allocation
          </p>
          <div className="relative w-full h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as { name: string; value: number };
                    return (
                      <div className="rounded-md border border-white/[0.06] bg-[#0f0f0f]/95 px-2 py-1 text-[11px] text-[#ededed]">
                        {d.name}: <span className="tabular-nums font-medium">{formatGBP(d.value)}</span>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Committed
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatGBP(fixed + savings)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className={cn("text-sm flex-1", bold ? "font-semibold" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums text-sm", bold ? "font-semibold" : "")} style={bold ? undefined : { color }}>
        {value >= 0 ? "" : ""}
        {formatGBP(Math.abs(value))}
      </span>
    </div>
  );
}
