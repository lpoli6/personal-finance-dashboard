"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import type { Subscription, SubscriptionCategory } from "@/types";

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
}

const CATEGORY_ORDER: SubscriptionCategory[] = ["fitness", "entertainment", "improvement", "car", "miscellaneous"];
const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  fitness: "Fitness",
  entertainment: "Entertainment",
  improvement: "Improvement",
  car: "Car",
  miscellaneous: "Miscellaneous",
};

export function SubscriptionList({ subscriptions, onEdit }: SubscriptionListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const active = subscriptions.filter((s) => s.is_active);
  const inactive = subscriptions.filter((s) => !s.is_active);

  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.map((cat) => {
        const catSubs = active
          .filter((s) => s.category === cat)
          .sort((a, b) => b.amount_pence - a.amount_pence);
        if (catSubs.length === 0) return null;

        const isCollapsed = collapsed.has(cat);
        const subtotal = catSubs.reduce((sum, s) => sum + s.amount_pence, 0);

        return (
          <Card key={cat}>
            <CardHeader
              className="cursor-pointer select-none py-3"
              onClick={() => toggle(cat)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-sm">{CATEGORY_LABELS[cat]}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{catSubs.length}</Badge>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatGBP(subtotal)}/mo</span>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {catSubs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-2 gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm tabular-nums w-20 text-right">{formatGBP(sub.amount_pence)}/mo</span>
                        <span className="text-xs text-muted-foreground w-24 text-right">{formatGBP(sub.amount_pence * 12)}/yr</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {sub.renewal_date ? format(parseISO(sub.renewal_date), "dd MMM yy") : "—"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sub)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {inactive.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">Cancelled ({inactive.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {inactive.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 opacity-50">
                  <span className="text-sm line-through">{sub.name}</span>
                  <span className="text-sm tabular-nums">{formatGBP(sub.amount_pence)}/mo</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
