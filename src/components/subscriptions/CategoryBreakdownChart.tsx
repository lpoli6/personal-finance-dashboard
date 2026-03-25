"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import type { Subscription, SubscriptionCategory } from "@/types";

interface CategoryBreakdownChartProps {
  subscriptions: Subscription[];
}

const COLORS: Record<SubscriptionCategory, string> = {
  fitness: "#22c55e",
  entertainment: "#3b82f6",
  improvement: "#8b5cf6",
  car: "#f59e0b",
  miscellaneous: "#6b7280",
};

const LABELS: Record<SubscriptionCategory, string> = {
  fitness: "Fitness",
  entertainment: "Entertainment",
  improvement: "Improvement",
  car: "Car",
  miscellaneous: "Miscellaneous",
};

export function CategoryBreakdownChart({ subscriptions }: CategoryBreakdownChartProps) {
  const categoryTotals = new Map<SubscriptionCategory, number>();
  for (const sub of subscriptions) {
    categoryTotals.set(sub.category, (categoryTotals.get(sub.category) || 0) + sub.amount_pence);
  }

  const data = Array.from(categoryTotals.entries())
    .map(([cat, total]) => ({ name: LABELS[cat], value: total, category: cat }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={COLORS[entry.category]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-card p-2 shadow-md text-sm">
                    <p className="font-medium">{d.name}</p>
                    <p className="tabular-nums">{formatGBP(d.value)}/mo</p>
                  </div>
                );
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
