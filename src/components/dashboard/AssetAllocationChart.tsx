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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>Composition over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fontSize: 11 }}
              width={60}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-md text-sm">
                    <p className="font-semibold mb-2">{label}</p>
                    {[...payload].reverse().map((entry: any) => (
                      <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-medium tabular-nums">{formatGBP(entry.value)}</span>
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
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
