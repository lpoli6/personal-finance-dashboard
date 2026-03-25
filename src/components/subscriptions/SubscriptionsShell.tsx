"use client";

import { useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { SubscriptionList } from "./SubscriptionList";
import { SubscriptionFormDialog } from "./SubscriptionFormDialog";
import { AuditCallout } from "./AuditCallout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Subscription } from "@/types";

interface SubscriptionsShellProps {
  subscriptions: Subscription[];
}

export function SubscriptionsShell({ subscriptions }: SubscriptionsShellProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);

  const active = subscriptions.filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <SummaryCards subscriptions={active} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Subscription
            </Button>
          </div>
          <SubscriptionList subscriptions={subscriptions} onEdit={setEditSub} />
        </div>
        <div className="space-y-6">
          <CategoryBreakdownChart subscriptions={active} />
          <AuditCallout subscriptions={active} />
        </div>
      </div>

      <SubscriptionFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editSub && (
        <SubscriptionFormDialog
          open={true}
          onOpenChange={(o) => { if (!o) setEditSub(null); }}
          subscription={editSub}
        />
      )}
    </div>
  );
}
