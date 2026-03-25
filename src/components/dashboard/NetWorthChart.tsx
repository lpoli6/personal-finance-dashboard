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
import { CATEGORY_COLORS } from "@/lib/constants/chart-colors";
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
    { label: "Cash", value: d.cash, color: CATEGORY_COLORS.cash.dark },
    { label: "ISA", value: d.isa, color: CATEGORY_COLORS.isa.dark },
    { label: "Pension", value: d.pension, color: CATEGORY_COLORS.pension.dark },
    { label: "Investments", value: d.investment, color: CATEGORY_COLORS.investment.dark },
    { label: "Property", value: d.property, color: CATEGORY_COLORS.property.dark },
  ];
  return (
    <div className="rounded-xl bg-[#141414] text-[#e5e5e5] p-3 shadow-xl text-sm border-0">
      <p className="font-semibold mb-2">{label}</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[#737373]">{item.label}</span>
          </div>
          <span className="font-medium tabular-nums font-mono">{formatGBP(item.value)}</span>
        </div>
      ))}
      <div className="border-t border-[#262626] mt-2 pt-2 flex justify-between font-semibold">
        <span>Net Worth</span>
        <span className="tabular-nums font-mono">{formatGBP(d.netWorth)}</span>
      </div>
    </div>
  );
}

export function NetWorthChart({ data, onSelectMonth }: NetWorthChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const lineColor = "#10b981";
  const gridColor = isDark ? "#1e1e1e" : "#f0f0f0";
  const axisColor = isDark ? "#737373" : "#a3a3a3";

  return (
    <Card className="rounded-xl border-border/30 p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle>Net Worth</CardTitle>
        <CardDescription>Total net worth over time</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
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
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={lineColor}
              fill="url(#netWorthGradient)"
              strokeWidth={2}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
