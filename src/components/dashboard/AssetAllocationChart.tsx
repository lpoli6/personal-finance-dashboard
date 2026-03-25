"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { CATEGORY_COLORS } from "@/lib/constants/chart-colors";
import type { NetWorthChartPoint } from "@/types";

interface AssetAllocationChartProps {
  data: NetWorthChartPoint[];
}

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

const CATEGORIES = [
  { key: "cash", label: "Cash" },
  { key: "isa", label: "ISA" },
  { key: "pension", label: "Pension" },
  { key: "investment", label: "Investments" },
  { key: "property", label: "Property" },
] as const;

export function AssetAllocationChart({ data }: AssetAllocationChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#1e1e1e" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";

  return (
    <Card className="rounded-xl border-border/30 p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>Composition over time</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
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
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl bg-[#141414] text-[#e5e5e5] p-3 shadow-xl text-sm border-0">
                    <p className="font-semibold mb-2">{label}</p>
                    {[...payload].reverse().map((entry: any) => (
                      <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                          <span className="text-[#737373]">{entry.name}</span>
                        </div>
                        <span className="font-medium tabular-nums font-mono">{formatGBP(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            {CATEGORIES.map(({ key, label }) => {
              const color = isDark
                ? CATEGORY_COLORS[key].dark
                : CATEGORY_COLORS[key].light;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.6}
                  animationDuration={800}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
