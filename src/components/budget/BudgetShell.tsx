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
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
          <ArrowLeftRight className="h-5 w-5" />
          <span className="text-sm">Import transactions to see budget vs actual spending.</span>
        </CardContent>
      </Card>
    </div>
  );
}
