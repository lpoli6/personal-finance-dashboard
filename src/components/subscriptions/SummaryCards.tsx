"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import type { Subscription } from "@/types";

interface SummaryCardsProps {
  subscriptions: Subscription[];
}

export function SummaryCards({ subscriptions }: SummaryCardsProps) {
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount_pence, 0);
  const totalAnnual = totalMonthly * 12;
  const mostExpensive = subscriptions.reduce(
    (max, s) => (s.amount_pence > (max?.amount_pence || 0) ? s : max),
    subscriptions[0]
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Monthly Burn</p>
          <p className="text-2xl font-bold mt-1">{formatGBP(totalMonthly)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Annual Cost</p>
          <p className="text-2xl font-bold mt-1">{formatGBP(totalAnnual)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold mt-1">{subscriptions.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Most Expensive</p>
          <p className="text-lg font-bold mt-1">
            {mostExpensive ? `${mostExpensive.name}` : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {mostExpensive ? `${formatGBP(mostExpensive.amount_pence)}/mo` : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
