"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSubscription, updateSubscription, deactivateSubscription } from "@/app/actions/subscriptions";
import { toast } from "sonner";
import type { Subscription, SubscriptionCategory } from "@/types";

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
}

const CATEGORIES: { value: SubscriptionCategory; label: string }[] = [
  { value: "fitness", label: "Fitness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "improvement", label: "Improvement" },
  { value: "car", label: "Car" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
] as const;

export function SubscriptionFormDialog({ open, onOpenChange, subscription }: SubscriptionFormDialogProps) {
  const isEditing = !!subscription;

  const [name, setName] = useState(subscription?.name || "");
  const [amount, setAmount] = useState(subscription ? (subscription.amount_pence / 100).toString() : "");
  const [frequency, setFrequency] = useState(subscription?.frequency || "monthly");
  const [category, setCategory] = useState<SubscriptionCategory>(subscription?.category || "miscellaneous");
  const [renewalDate, setRenewalDate] = useState(subscription?.renewal_date || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !amount) {
      toast.error("Name and amount are required");
      return;
    }
    setIsSaving(true);

    const amountPence = Math.round(parseFloat(amount) * 100);
    const data = {
      name: name.trim(),
      amount_pence: amountPence,
      frequency: frequency as Subscription["frequency"],
      category,
      renewal_date: renewalDate || null,
    };

    const result = isEditing
      ? await updateSubscription(subscription.id, data)
      : await createSubscription(data);

    setIsSaving(false);
    if (result.success) {
      toast.success(isEditing ? "Updated" : "Created");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed");
    }
  };

  const handleDeactivate = async () => {
    if (!subscription) return;
    setIsSaving(true);
    const result = await deactivateSubscription(subscription.id);
    setIsSaving(false);
    if (result.success) {
      toast.success("Cancelled");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update subscription details." : "Track a new recurring cost."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Monthly Cost (£)</label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Frequency</label>
              <Select value={frequency} onValueChange={(v) => { if (v) setFrequency(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={category} onValueChange={(v) => { if (v) setCategory(v as SubscriptionCategory); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Renewal Date</label>
              <Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          {isEditing && subscription.is_active && (
            <div className="mr-auto">
              {showDeactivate ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Cancel this subscription?</span>
                  <Button variant="destructive" size="sm" onClick={handleDeactivate} disabled={isSaving}>Confirm</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeactivate(false)}>No</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setShowDeactivate(true)}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
