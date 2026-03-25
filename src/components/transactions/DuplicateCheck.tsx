"use client";

import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/utils/currency";
import { ArrowLeft, ArrowRight, SkipForward, Import } from "lucide-react";
import type { ParsedTransaction, TransactionWithCategory } from "@/types";

interface DuplicateCheckProps {
  transactions: ParsedTransaction[];
  existingTransactions: TransactionWithCategory[];
  onResolved: (resolved: ParsedTransaction[]) => void;
  onBack: () => void;
}

export function DuplicateCheck({
  transactions,
  existingTransactions,
  onResolved,
  onBack,
}: DuplicateCheckProps) {
  const existingMap = useMemo(() => {
    const map = new Map<string, TransactionWithCategory>();
    for (const tx of existingTransactions) {
      map.set(tx.id, tx);
    }
    return map;
  }, [existingTransactions]);

  const duplicates = useMemo(
    () =>
      transactions
        .map((tx, index) => ({ tx, index }))
        .filter(({ tx }) => tx.isDuplicate),
    [transactions]
  );

  // Auto-advance if no duplicates
  useEffect(() => {
    if (duplicates.length === 0) {
      onResolved(transactions);
    }
  }, [duplicates.length, onResolved, transactions]);

  if (duplicates.length === 0) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No duplicates found. Advancing...
        </div>
      </div>
    );
  }

  const handleSkip = (index: number) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], excluded: true };
    const remaining = updated
      .map((tx, i) => ({ tx, i }))
      .filter(({ tx }) => tx.isDuplicate && !tx.excluded);

    if (remaining.length === 0) {
      onResolved(updated);
    } else {
      onResolved(updated);
    }
  };

  const handleImportAnyway = (index: number) => {
    const updated = [...transactions];
    updated[index] = {
      ...updated[index],
      isDuplicate: false,
      duplicateOf: null,
    };
    const remaining = updated
      .map((tx, i) => ({ tx, i }))
      .filter(({ tx }) => tx.isDuplicate && !tx.excluded);

    if (remaining.length === 0) {
      onResolved(updated);
    } else {
      // Update state but stay on this step until all resolved
      onResolved(updated);
    }
  };

  const handleSkipAll = () => {
    const updated = transactions.map((tx) =>
      tx.isDuplicate ? { ...tx, excluded: true } : tx
    );
    onResolved(updated);
  };

  const handleImportAll = () => {
    const updated = transactions.map((tx) =>
      tx.isDuplicate
        ? { ...tx, isDuplicate: false, duplicateOf: null }
        : tx
    );
    onResolved(updated);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {duplicates.length} potential duplicate
          {duplicates.length === 1 ? "" : "s"}.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSkipAll}>
            Skip All
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportAll}>
            Import All
          </Button>
        </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-3">
        {duplicates.map(({ tx, index }) => {
          const existing = tx.duplicateOf
            ? existingMap.get(tx.duplicateOf)
            : null;

          return (
            <Card key={index} size="sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Potential Duplicate
                  </Badge>
                  {tx.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">
                      New Transaction
                    </p>
                    <p>Date: {tx.date}</p>
                    <p>
                      Amount: {formatGBP(tx.amountPence)}{" "}
                      <Badge
                        variant={
                          tx.direction === "credit"
                            ? "default"
                            : "destructive"
                        }
                        className="text-[10px] px-1 h-4"
                      >
                        {tx.direction === "credit" ? "CR" : "DR"}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground truncate">
                      {tx.originalDescription}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">
                      Existing Transaction
                    </p>
                    {existing ? (
                      <>
                        <p>Date: {existing.date}</p>
                        <p>
                          Amount: {formatGBP(existing.amount_pence)}{" "}
                          <Badge
                            variant={
                              existing.direction === "credit"
                                ? "default"
                                : "destructive"
                            }
                            className="text-[10px] px-1 h-4"
                          >
                            {existing.direction === "credit" ? "CR" : "DR"}
                          </Badge>
                        </p>
                        <p className="text-muted-foreground truncate">
                          {existing.description}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        Match found by amount and date
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSkip(index)}
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleImportAnyway(index)}
                  >
                    <Import className="h-3 w-3 mr-1" />
                    Import Anyway
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={() => onResolved(transactions)}>
          Next
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
