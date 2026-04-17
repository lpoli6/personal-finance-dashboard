"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { POSITIVE_COLOR, NEGATIVE_COLOR } from "@/lib/constants/chart-colors";
import type { MoMChangePoint } from "@/types";

interface MoMChangeChartProps {
  data: MoMChangePoint[];
}

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  if (Math.abs(pounds) >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

export function MoMChangeChart({ data }: MoMChangeChartProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const gridColor = isDark ? "#1a1a1a" : "#f0f0f0";
  const axisColor = isDark ? "#6b6b6b" : "#a3a3a3";
  const refLineColor = isDark ? "#262626" : "#e5e5e5";

  // Compute trailing stats for the mini header
  const recent = data.slice(-6);
  const positiveMonths = recent.filter((d) => d.change >= 0).length;
  const avg = recent.length
    ? recent.reduce((s, d) => s + d.change, 0) / recent.length
    : 0;

  return (
    <Card className="rounded-2xl border-border bg-card/40 p-6">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Monthly change
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Net worth delta, month by month
            </p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <div className="rounded-md border border-border bg-background/40 px-2.5 py-1.5">
              <span className="text-muted-foreground">6M avg</span>{" "}
              <span className="font-semibold tabular-nums ml-1">
                {avg >= 0 ? "+" : ""}
                {formatGBP(Math.round(avg))}
              </span>
            </div>
            <div className="rounded-md border border-border bg-background/40 px-2.5 py-1.5">
              <span className="text-muted-foreground">Green months</span>{" "}
              <span className="font-semibold tabular-nums ml-1 text-emerald-500">
                {positiveMonths}/{recent.length}
              </span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
              cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null;
                const value = payload[0].value as number;
                return (
                  <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur text-[#ededed] p-3 shadow-2xl text-xs">
                    <p className="font-semibold text-[13px]">{label}</p>
                    <p
                      className="font-medium tabular-nums mt-1 text-[13px]"
                      style={{ color: value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR }}
                    >
                      {value >= 0 ? "+" : ""}
                      {formatGBP(value)}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke={refLineColor} />
            <Bar dataKey="change" radius={[3, 3, 0, 0]} animationDuration={700}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
