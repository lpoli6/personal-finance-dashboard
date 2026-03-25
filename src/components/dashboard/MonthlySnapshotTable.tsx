"use client";

import { useState, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { upsertSnapshots } from "@/app/actions/snapshots";
import { toast } from "sonner";
import type { MonthData, Account, AccountCategory } from "@/types";
import { format, parseISO } from "date-fns";

interface MonthlySnapshotTableProps {
  months: MonthData[];
  accounts: Account[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  cash: "Cash",
  isa: "ISA",
  pension: "Pension",
  investment: "Investments",
  property: "Property",
};

const CATEGORY_ORDER: AccountCategory[] = ["cash", "isa", "pension", "investment", "property"];

export function MonthlySnapshotTable({
  months,
  accounts,
  selectedMonth,
  onSelectMonth,
}: MonthlySnapshotTableProps) {
  const monthData = months.find((m) => m.month === selectedMonth);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const isDirty = Object.keys(editValues).length > 0;

  const getBalance = useCallback(
    (accountId: string) => {
      if (editValues[accountId] !== undefined) {
        const val = parseFloat(editValues[accountId]);
        return isNaN(val) ? 0 : Math.round(val * 100);
      }
      return monthData?.accounts[accountId] || 0;
    },
    [editValues, monthData]
  );

  const handleSave = async () => {
    if (!monthData) return;
    setIsSaving(true);
    const balances = accounts.map((a) => ({
      accountId: a.id,
      balancePence: getBalance(a.id),
    }));
    const result = await upsertSnapshots(selectedMonth, balances);
    setIsSaving(false);
    if (result.success) {
      toast.success("Saved successfully");
      setEditValues({});
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  const orderedAccounts = CATEGORY_ORDER.flatMap((cat) =>
    accounts.filter((a) => a.category === cat)
  );

  const inputIds = orderedAccounts.map((a) => a.id);

  const handleKeyDown = (e: React.KeyboardEvent, accountId: string) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const idx = inputIds.indexOf(accountId);
      const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < inputIds.length) {
        const nextRef = inputRefs.current.get(inputIds[nextIdx]);
        nextRef?.focus();
        nextRef?.select();
      }
    }
  };

  let currentCategory: AccountCategory | null = null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Monthly Snapshot</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={(v) => { if (v) onSelectMonth(v); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.month} value={m.month}>
                  {format(parseISO(m.month), "MMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDirty && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right w-44">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedAccounts.map((account) => {
              const showCategoryHeader = account.category !== currentCategory;
              if (showCategoryHeader) currentCategory = account.category;

              const balance = getBalance(account.id);
              const isEditing = editValues[account.id] !== undefined;

              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {showCategoryHeader && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[account.category]}
                        </Badge>
                      )}
                      {!showCategoryHeader && <span className="w-[calc(theme(spacing.2)+var(--badge-width,0px))]" />}
                      <span className={cn(account.side === "liability" && "text-red-600 dark:text-red-400")}>
                        {account.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current.set(account.id, el);
                      }}
                      type="number"
                      step="0.01"
                      className="text-right h-8 w-36 ml-auto tabular-nums"
                      value={isEditing ? editValues[account.id] : (balance / 100).toFixed(2)}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [account.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => handleKeyDown(e, account.id)}
                      onFocus={(e) => {
                        if (!isEditing) {
                          setEditValues((prev) => ({
                            ...prev,
                            [account.id]: (balance / 100).toFixed(2),
                          }));
                        }
                        e.target.select();
                      }}
                      onBlur={() => {
                        const val = editValues[account.id];
                        if (val !== undefined) {
                          const pence = Math.round(parseFloat(val || "0") * 100);
                          const original = monthData?.accounts[account.id] || 0;
                          if (pence === original) {
                            setEditValues((prev) => {
                              const next = { ...prev };
                              delete next[account.id];
                              return next;
                            });
                          }
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Net Worth</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatGBP(
                  orderedAccounts.reduce((sum, a) => {
                    const bal = getBalance(a.id);
                    return sum + (a.side === "asset" ? bal : -bal);
                  }, 0)
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
