"use client";

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
import type { NetWorthChartPoint } from "@/types";

interface AssetAllocationChartProps {
  data: NetWorthChartPoint[];
}

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  const abs = Math.abs(pounds);
  if (abs >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

const CATEGORIES = [
  { key: "cash", label: "Cash" },
  { key: "isa", label: "ISA" },
  { key: "investment", label: "GIA" },
  { key: "pension", label: "Pension" },
  { key: "property", label: "Property" },
] as const;

export function AssetAllocationChart({ data }: AssetAllocationChartProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const gridColor = isDark ? "#1a1a1a" : "#f0f0f0";
  const axisColor = isDark ? "#6b6b6b" : "#a3a3a3";

  // Current allocation % for the legend pills
  const latest = data[data.length - 1];
  const total =
    (latest?.cash ?? 0) +
    (latest?.isa ?? 0) +
    (latest?.investment ?? 0) +
    (latest?.pension ?? 0) +
    (latest?.property ?? 0);

  return (
    <Card className="rounded-2xl border-border bg-card/40 p-6">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Asset allocation
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Composition over time
            </p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(({ key, label }) => {
            const val = latest?.[key] ?? 0;
            const pct = total ? (val / total) * 100 : 0;
            const color = CATEGORY_COLORS[key]?.dark ?? "#737373";
            return (
              <div
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 pl-2 pr-2.5 py-1"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            />
            <Tooltip
              cursor={{ stroke: isDark ? "#262626" : "#e5e5e5", strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur text-[#ededed] p-3 shadow-2xl text-xs min-w-[180px]">
                    <p className="font-semibold mb-2 text-[13px]">{label}</p>
                    <div className="space-y-1">
                      {[...payload].reverse().map((entry) => {
                        const e = entry as { dataKey?: string; color?: string; name?: string; value?: number };
                        return (
                        <div key={e.dataKey} className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                            <span className="text-[#8a8a8a]">{e.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">{formatGBP(Number(e.value ?? 0))}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            {CATEGORIES.map(({ key, label }) => {
              const color = CATEGORY_COLORS[key]?.dark ?? "#737373";
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.55}
                  strokeWidth={1.25}
                  animationDuration={700}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
