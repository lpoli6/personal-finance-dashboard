"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { createCategoryRule } from "@/app/actions/transactions";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Pencil, Check, X } from "lucide-react";
import type {
  ParsedTransaction,
  TransactionCategory,
} from "@/types";
import type { BankFormatId } from "@/lib/constants/bank-formats";

interface PreviewTableProps {
  transactions: ParsedTransaction[];
  categories: TransactionCategory[];
  onTransactionsChange: (txs: ParsedTransaction[]) => void;
  onNext: () => void;
  onBack: () => void;
  bankFormatId: BankFormatId;
}

export function PreviewTable({
  transactions,
  categories,
  onTransactionsChange,
  onNext,
  onBack,
  bankFormatId,
}: PreviewTableProps) {
  const [editingDescIndex, setEditingDescIndex] = useState<number | null>(null);
  const [editingDescValue, setEditingDescValue] = useState("");
  const [savingRule, setSavingRule] = useState<number | null>(null);
  const [manuallyChanged, setManuallyChanged] = useState<Set<number>>(
    new Set()
  );

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_category_id),
    [categories]
  );

  const childCategories = useMemo(() => {
    const map = new Map<string, TransactionCategory[]>();
    for (const c of categories) {
      if (c.parent_category_id) {
        const existing = map.get(c.parent_category_id) || [];
        existing.push(c);
        map.set(c.parent_category_id, existing);
      }
    }
    return map;
  }, [categories]);

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const updateTransaction = (
    index: number,
    updates: Partial<ParsedTransaction>
  ) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], ...updates };
    onTransactionsChange(updated);
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    const cat = catMap.get(categoryId);
    updateTransaction(index, {
      categoryId,
      categoryName: cat?.name || null,
      confidence: 1.0,
    });
    setManuallyChanged((prev) => new Set(prev).add(index));
  };

  const handleSaveRule = async (index: number) => {
    const tx = transactions[index];
    if (!tx.categoryId) return;

    setSavingRule(index);
    const result = await createCategoryRule(
      tx.originalDescription || tx.description,
      tx.categoryId,
      bankFormatId
    );
    setSavingRule(null);

    if (result.success) {
      toast.success("Category rule saved");
      setManuallyChanged((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    } else {
      toast.error(result.error || "Failed to save rule");
    }
  };

  const handleToggleExclude = (index: number) => {
    updateTransaction(index, { excluded: !transactions[index].excluded });
  };

  const startEditDescription = (index: number) => {
    setEditingDescIndex(index);
    setEditingDescValue(transactions[index].description);
  };

  const confirmEditDescription = (index: number) => {
    if (editingDescValue.trim()) {
      updateTransaction(index, { description: editingDescValue.trim() });
    }
    setEditingDescIndex(null);
    setEditingDescValue("");
  };

  const cancelEditDescription = () => {
    setEditingDescIndex(null);
    setEditingDescValue("");
  };

  const activeTransactions = transactions.filter((t) => !t.excluded);
  const totalDebits = activeTransactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + t.amountPence, 0);
  const totalCredits = activeTransactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + t.amountPence, 0);

  return (
    <div className="space-y-4">
      <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-48">Category</TableHead>
              <TableHead className="w-20 text-center">Exclude</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, i) => (
              <TableRow
                key={i}
                className={cn(tx.excluded && "opacity-40 line-through")}
              >
                <TableCell className="text-xs">{tx.date}</TableCell>
                <TableCell>
                  {editingDescIndex === i ? (
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-6 text-xs"
                        value={editingDescValue}
                        onChange={(e) => setEditingDescValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEditDescription(i);
                          if (e.key === "Escape") cancelEditDescription();
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => confirmEditDescription(i)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={cancelEditDescription}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group/desc">
                      <span className="text-xs truncate max-w-[280px]">
                        {tx.description}
                      </span>
                      <button
                        className="opacity-0 group-hover/desc:opacity-100 transition-opacity"
                        onClick={() => startEditDescription(i)}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-mono">
                      {formatGBP(tx.amountPence)}
                    </span>
                    <Badge
                      variant={
                        tx.direction === "credit" ? "default" : "destructive"
                      }
                      className="text-[10px] px-1 h-4"
                    >
                      {tx.direction === "credit" ? "CR" : "DR"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <Select
                      value={tx.categoryId || undefined}
                      onValueChange={(v) => {
                        if (v) handleCategoryChange(i, v);
                      }}
                    >
                      <SelectTrigger size="sm" className="w-full text-xs h-6">
                        <SelectValue placeholder="Uncategorised" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCategories.map((parent) => {
                          const children = childCategories.get(parent.id);
                          if (children && children.length > 0) {
                            return (
                              <SelectGroup key={parent.id}>
                                <SelectLabel>{parent.name}</SelectLabel>
                                {children.map((child) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    {child.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            );
                          }
                          return (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {manuallyChanged.has(i) && tx.categoryId && (
                      <button
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => handleSaveRule(i)}
                        disabled={savingRule === i}
                      >
                        {savingRule === i ? "Saving..." : "Save as rule?"}
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <input
                    type="checkbox"
                    checked={tx.excluded}
                    onChange={() => handleToggleExclude(i)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                {activeTransactions.length} transactions
              </TableCell>
              <TableCell className="text-right text-xs">
                <div className="space-y-0.5">
                  <div className="text-destructive">
                    DR: {formatGBP(totalDebits)}
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    CR: {formatGBP(totalCredits)}
                  </div>
                </div>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNext} disabled={activeTransactions.length === 0}>
          Next
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
