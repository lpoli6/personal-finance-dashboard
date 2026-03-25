"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import type { BudgetItem } from "@/types";

interface BudgetWaterfallProps {
  items: BudgetItem[];
}

export function BudgetWaterfall({ items }: BudgetWaterfallProps) {
  const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount_pence, 0);
  const fixed = items.filter((i) => i.type === "fixed").reduce((s, i) => s + i.amount_pence, 0);
  const savings = items.filter((i) => i.type === "savings").reduce((s, i) => s + i.amount_pence, 0);
  const discretionary = income - fixed - savings;

  const data = [
    { name: "Income", value: income, color: "#22c55e" },
    { name: "Fixed Costs", value: -fixed, color: "#ef4444" },
    { name: "Savings", value: -savings, color: "#3b82f6" },
    { name: "Discretionary", value: discretionary, color: "#f59e0b" },
  ];

  // Build waterfall data with running totals
  const waterfall = data.map((d, i) => {
    if (i === 0) return { ...d, start: 0, end: d.value, display: d.value };
    if (i === data.length - 1) return { ...d, start: 0, end: discretionary, display: discretionary };
    const prev = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    return { ...d, start: prev + d.value, end: prev, display: Math.abs(d.value) };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>Income → committed → discretionary</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-500">{formatGBP(discretionary)}</p>
            <p className="text-xs text-muted-foreground">discretionary</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={waterfall} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `£${(v / 100).toLocaleString()}`}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-card p-2 shadow-md text-sm">
                    <p className="font-medium">{d.name}</p>
                    <p className="tabular-nums">{formatGBP(d.display)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="display" radius={[0, 4, 4, 0]}>
              {waterfall.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
