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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Changes</CardTitle>
        <CardDescription>Net worth change month-on-month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
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
                if (!active || !payload?.[0]) return null;
                const value = payload[0].value as number;
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-md text-sm">
                    <p className="font-semibold">{label}</p>
                    <p
                      className="font-medium mt-1"
                      style={{ color: value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR }}
                    >
                      {value >= 0 ? "+" : ""}
                      {formatGBP(value)}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} className="stroke-border" />
            <Bar dataKey="change" radius={[4, 4, 0, 0]}>
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
