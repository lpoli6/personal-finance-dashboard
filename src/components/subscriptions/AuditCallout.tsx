"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import type { Subscription, SubscriptionCategory } from "@/types";

interface AuditCalloutProps {
  subscriptions: Subscription[];
}

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  fitness: "Fitness",
  entertainment: "Entertainment",
  improvement: "Improvement",
  car: "Car",
  miscellaneous: "Miscellaneous",
};

export function AuditCallout({ subscriptions }: AuditCalloutProps) {
  const flags: string[] = [];

  // Flag subscriptions over £50/month
  const expensive = subscriptions
    .filter((s) => s.amount_pence > 5000)
    .sort((a, b) => b.amount_pence - a.amount_pence);

  for (const sub of expensive) {
    flags.push(`${sub.name} at ${formatGBP(sub.amount_pence)}/mo is one of your most expensive subscriptions.`);
  }

  // Flag categories over £200/month
  const categoryTotals = new Map<SubscriptionCategory, number>();
  for (const sub of subscriptions) {
    categoryTotals.set(sub.category, (categoryTotals.get(sub.category) || 0) + sub.amount_pence);
  }
  for (const [cat, total] of categoryTotals) {
    if (total > 20000) {
      flags.push(
        `You spend ${formatGBP(total)}/mo on ${CATEGORY_LABELS[cat]} — worth reviewing?`
      );
    }
  }

  if (flags.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm text-amber-700 dark:text-amber-400">Worth Reviewing</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {flags.map((flag, i) => (
            <li key={i}>{flag}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
