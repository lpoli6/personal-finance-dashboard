"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { upsertSnapshots } from "@/app/actions/snapshots";
import { toast } from "sonner";
import { addMonths, format, parseISO } from "date-fns";
import type { MonthData, Account, AccountCategory } from "@/types";

interface AddMonthSheetProps {
  accounts: Account[];
  latestMonthData: MonthData | undefined;
}

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  cash: "Cash",
  isa: "ISA",
  pension: "Pension",
  investment: "Investments",
  property: "Property",
};

const CATEGORY_ORDER: AccountCategory[] = ["cash", "isa", "pension", "investment", "property"];

export function AddMonthSheet({ accounts, latestMonthData }: AddMonthSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const nextMonth = latestMonthData
    ? addMonths(parseISO(latestMonthData.month), 1)
    : new Date();
  const nextMonthISO = format(nextMonth, "yyyy-MM-dd");
  const nextMonthLabel = format(nextMonth, "MMM yyyy");

  const orderedAccounts = CATEGORY_ORDER.flatMap((cat) =>
    accounts.filter((a) => a.category === cat)
  );
  const inputIds = orderedAccounts.map((a) => a.id);

  const initValues = () => {
    const init: Record<string, string> = {};
    for (const a of accounts) {
      const prevBalance = latestMonthData?.accounts[a.id] || 0;
      init[a.id] = (prevBalance / 100).toFixed(2);
    }
    setValues(init);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const balances = accounts.map((a) => ({
      accountId: a.id,
      balancePence: Math.round(parseFloat(values[a.id] || "0") * 100),
    }));
    const result = await upsertSnapshots(nextMonthISO, balances);
    setIsSaving(false);
    if (result.success) {
      toast.success(`${nextMonthLabel} added`);
      setOpen(false);
      setValues({});
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, accountId: string) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const idx = inputIds.indexOf(accountId);
      const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < inputIds.length) {
        const ref = inputRefs.current.get(inputIds[nextIdx]);
        ref?.focus();
        ref?.select();
      }
    }
  };

  let currentCategory: AccountCategory | null = null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) initValues();
      }}
    >
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Add Month
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Month: {nextMonthLabel}</SheetTitle>
          <SheetDescription>
            Pre-filled from {latestMonthData ? format(parseISO(latestMonthData.month), "MMM yyyy") : "scratch"}.
            Update balances and save.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-1 py-4">
          {orderedAccounts.map((account) => {
            const showCategoryHeader = account.category !== currentCategory;
            if (showCategoryHeader) currentCategory = account.category;

            return (
              <div key={account.id}>
                {showCategoryHeader && (
                  <div className="pt-3 pb-1">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[account.category]}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm truncate flex-1">{account.name}</span>
                  <Input
                    ref={(el) => {
                      if (el) inputRefs.current.set(account.id, el);
                    }}
                    type="number"
                    step="0.01"
                    className="text-right h-8 w-32 tabular-nums"
                    value={values[account.id] || ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [account.id]: e.target.value }))
                    }
                    onKeyDown={(e) => handleKeyDown(e, account.id)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 flex justify-between items-center text-sm font-semibold">
          <span>Net Worth</span>
          <span className="tabular-nums">
            {formatGBP(
              orderedAccounts.reduce((sum, a) => {
                const pence = Math.round(parseFloat(values[a.id] || "0") * 100);
                return sum + (a.side === "asset" ? pence : -pence);
              }, 0)
            )}
          </span>
        </div>

        <SheetFooter className="mt-4">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : `Save ${nextMonthLabel}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
