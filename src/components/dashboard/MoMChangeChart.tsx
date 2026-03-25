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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const isDark = theme === "dark";
  const gridColor = isDark ? "#1e1e1e" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";
  const refLineColor = isDark ? "#262626" : "#e5e5e5";

  return (
    <Card className="rounded-xl border-border/30 p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle>Monthly Changes</CardTitle>
        <CardDescription>Net worth change month-on-month</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: axisColor }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fontSize: 10, fill: axisColor }}
              width={60}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null;
                const value = payload[0].value as number;
                return (
                  <div className="rounded-xl bg-[#141414] text-[#e5e5e5] p-3 shadow-xl text-sm border-0">
                    <p className="font-semibold">{label}</p>
                    <p
                      className="font-medium font-mono tabular-nums mt-1"
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
            <Bar dataKey="change" radius={[4, 4, 0, 0]} animationDuration={800}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
