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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { NET_WORTH_COLOR, CATEGORY_COLORS } from "@/lib/constants/chart-colors";
import type { NetWorthChartPoint } from "@/types";

interface NetWorthChartProps {
  data: NetWorthChartPoint[];
  onSelectMonth?: (monthISO: string) => void;
}

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as NetWorthChartPoint;
  const items = [
    { label: "Cash", value: d.cash, color: CATEGORY_COLORS.cash.light },
    { label: "ISA", value: d.isa, color: CATEGORY_COLORS.isa.light },
    { label: "Pension", value: d.pension, color: CATEGORY_COLORS.pension.light },
    { label: "Investments", value: d.investment, color: CATEGORY_COLORS.investment.light },
    { label: "Property", value: d.property, color: CATEGORY_COLORS.property.light },
  ];
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
          <span className="font-medium tabular-nums">{formatGBP(item.value)}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
        <span>Net Worth</span>
        <span className="tabular-nums">{formatGBP(d.netWorth)}</span>
      </div>
    </div>
  );
}

export function NetWorthChart({ data, onSelectMonth }: NetWorthChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const lineColor = isDark ? NET_WORTH_COLOR.dark : NET_WORTH_COLOR.light;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
        <CardDescription>Total net worth over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            onClick={(e: any) => {
              const iso = e?.activePayload?.[0]?.payload?.monthISO;
              if (iso && onSelectMonth) onSelectMonth(iso);
            }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={lineColor}
              fill="url(#netWorthGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
