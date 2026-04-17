"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { CATEGORY_COLORS } from "@/lib/constants/chart-colors";
import { cn } from "@/lib/utils";
import type { NetWorthChartPoint } from "@/types";

interface NetWorthChartProps {
  data: NetWorthChartPoint[];
  onSelectMonth?: (monthISO: string) => void;
}

const RANGES = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "3Y", months: 36 },
  { label: "All", months: Infinity },
] as const;

type RangeKey = (typeof RANGES)[number]["label"];

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  const abs = Math.abs(pounds);
  if (abs >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: NetWorthChartPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const items = [
    { label: "Cash", value: d.cash, color: CATEGORY_COLORS.cash.dark },
    { label: "ISA", value: d.isa, color: CATEGORY_COLORS.isa.dark },
    { label: "Pension", value: d.pension, color: CATEGORY_COLORS.pension.dark },
    { label: "Investments", value: d.investment, color: CATEGORY_COLORS.investment.dark },
    { label: "Property", value: d.property, color: CATEGORY_COLORS.property.dark },
  ];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur text-[#ededed] p-3 shadow-2xl text-xs min-w-[200px]">
      <p className="font-semibold mb-2 text-[13px]">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[#8a8a8a]">{item.label}</span>
            </div>
            <span className="font-medium tabular-nums">{formatGBP(item.value)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between font-semibold">
        <span>Net Worth</span>
        <span className="tabular-nums text-emerald-400">{formatGBP(d.netWorth)}</span>
      </div>
    </div>
  );
}

export function NetWorthChart({ data, onSelectMonth }: NetWorthChartProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const [range, setRange] = useState<RangeKey>("1Y");
  const gridColor = isDark ? "#1a1a1a" : "#f0f0f0";
  const axisColor = isDark ? "#6b6b6b" : "#a3a3a3";

  const filtered = useMemo(() => {
    const months = RANGES.find((r) => r.label === range)!.months;
    if (!isFinite(months)) return data;
    return data.slice(-months);
  }, [data, range]);

  return (
    <Card className="rounded-2xl border-border bg-card/40 p-6">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Net worth
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Total wealth curve
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={cn(
                  "text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors tabular-nums",
                  range === r.label
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={filtered}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            onClick={(e) => {
              const iso = (e as unknown as { activePayload?: Array<{ payload: NetWorthChartPoint }> })
                ?.activePayload?.[0]?.payload?.monthISO;
              if (iso && onSelectMonth) onSelectMonth(iso);
            }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: axisColor }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fontSize: 10, fill: axisColor }}
              width={56}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 2000", "dataMax + 2000"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: isDark ? "#262626" : "#e5e5e5", strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#10b981"
              fill="url(#netWorthGradient)"
              strokeWidth={2.25}
              animationDuration={700}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#10b981", stroke: isDark ? "#0a0a0a" : "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
