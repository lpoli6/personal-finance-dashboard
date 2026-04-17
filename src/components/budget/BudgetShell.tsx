"use client";

import { BudgetWaterfall } from "./BudgetWaterfall";
import { BudgetItemsTable } from "./BudgetItemsTable";
import { PlannedExpensesTable } from "./PlannedExpensesTable";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";
import type { BudgetItem, PlannedExpense } from "@/types";

interface BudgetShellProps {
  budgetItems: BudgetItem[];
  plannedExpenses: PlannedExpense[];
}

export function BudgetShell({ budgetItems, plannedExpenses }: BudgetShellProps) {
  return (
    <div className="space-y-6">
      <BudgetWaterfall items={budgetItems} />

      <BudgetItemsTable items={budgetItems} />

      <PlannedExpensesTable expenses={plannedExpenses} />

      {/* Budget vs Actual placeholder */}
      <Card className="border border-dashed border-border bg-card/30 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-foreground">Budget vs actual</p>
          <p className="text-xs text-muted-foreground">Import transactions to see how reality compares to plan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
