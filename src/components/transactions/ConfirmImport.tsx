"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGBP } from "@/lib/utils/currency";
import { importTransactions } from "@/app/actions/transactions";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDownToLine,
  Loader2,
  Receipt,
  TrendingDown,
  TrendingUp,
  Ban,
} from "lucide-react";
import type { ParsedTransaction } from "@/types";

interface ConfirmImportProps {
  transactions: ParsedTransaction[];
  statementId: string;
  sourceAccount: string;
  onImportComplete: () => void;
  onBack: () => void;
}

export function ConfirmImport({
  transactions,
  statementId,
  sourceAccount,
  onImportComplete,
  onBack,
}: ConfirmImportProps) {
  const [isImporting, setIsImporting] = useState(false);

  const stats = useMemo(() => {
    const active = transactions.filter((t) => !t.excluded);
    const excluded = transactions.filter((t) => t.excluded);
    const debits = active.filter((t) => t.direction === "debit");
    const credits = active.filter((t) => t.direction === "credit");
    const totalDebits = debits.reduce((sum, t) => sum + t.amountPence, 0);
    const totalCredits = credits.reduce((sum, t) => sum + t.amountPence, 0);

    return {
      total: active.length,
      excluded: excluded.length,
      totalDebits,
      totalCredits,
      debitCount: debits.length,
      creditCount: credits.length,
    };
  }, [transactions]);

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const toImport = transactions
        .filter((t) => !t.excluded)
        .map((t) => ({
          date: t.date,
          description: t.description,
          originalDescription: t.originalDescription,
          amountPence: t.amountPence,
          direction: t.direction,
          categoryId: t.categoryId,
        }));

      const result = await importTransactions({
        statementId,
        sourceAccount,
        transactions: toImport,
      });

      if (result.success) {
        toast.success(`Imported ${stats.total} transactions`);
        onImportComplete();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Debits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {formatGBP(stats.totalDebits)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.debitCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatGBP(stats.totalCredits)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.creditCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Ban className="h-3 w-3" />
              Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.excluded}</p>
            <p className="text-xs text-muted-foreground">
              excluded / duplicates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting || stats.total === 0}
          size="lg"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4 mr-1" />
              Import {stats.total} Transaction{stats.total === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
