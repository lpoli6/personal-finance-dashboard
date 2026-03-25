"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createAccount, updateAccount, deactivateAccount } from "@/app/actions/accounts";
import { toast } from "sonner";
import type { AccountWithBalance, AccountCategory, AccountSide } from "@/types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountWithBalance;
  accounts: AccountWithBalance[];
}

const CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "isa", label: "ISA" },
  { value: "pension", label: "Pension" },
  { value: "investment", label: "Investments" },
  { value: "property", label: "Property" },
];

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  accounts,
}: AccountFormDialogProps) {
  const isEditing = !!account;

  const [name, setName] = useState(account?.name || "");
  const [category, setCategory] = useState<AccountCategory>(account?.category || "cash");
  const [side, setSide] = useState<AccountSide>(account?.side || "asset");
  const [displayOrder, setDisplayOrder] = useState(account?.display_order?.toString() || "0");
  const [notes, setNotes] = useState(account?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);

    const data = {
      name: name.trim(),
      category,
      side,
      display_order: parseInt(displayOrder) || 0,
      notes: notes.trim() || null,
    };

    const result = isEditing
      ? await updateAccount(account.id, data)
      : await createAccount(data);

    setIsSaving(false);
    if (result.success) {
      toast.success(isEditing ? "Account updated" : "Account created");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  const handleDeactivate = async () => {
    if (!account) return;
    setIsSaving(true);
    const result = await deactivateAccount(account.id);
    setIsSaving(false);
    if (result.success) {
      toast.success("Account deactivated");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to deactivate");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Account" : "Add Account"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update account details. Historical data is preserved."
              : "Create a new account to track."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus (Cash Savings)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={category}
                onValueChange={(v) => { if (v) setCategory(v as AccountCategory); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Side</label>
              <Select
                value={side}
                onValueChange={(v) => { if (v) setSide(v as AccountSide); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Display Order</label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <DialogFooter>
          {isEditing && account.is_active && (
            <div className="mr-auto">
              {showDeactivateConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Deactivate? Data preserved.</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeactivate}
                    disabled={isSaving}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeactivateConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setShowDeactivateConfirm(true)}
                >
                  Deactivate
                </Button>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
