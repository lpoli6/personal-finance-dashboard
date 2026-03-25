"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { togglePlannedExpenseComplete } from "@/app/actions/budget";
import { toast } from "sonner";
import type { PlannedExpense } from "@/types";

interface PlannedExpensesTableProps {
  expenses: PlannedExpense[];
}

const PRIORITY_COLORS: Record<string, string> = {
  Essential: "bg-red-500/10 text-red-700 dark:text-red-400",
  High: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

const TOTAL_BUDGET = 15000000; // £150,000 in pence

export function PlannedExpensesTable({ expenses }: PlannedExpensesTableProps) {
  const totalPlanned = expenses.reduce((s, e) => s + e.amount_pence, 0);
  const completedTotal = expenses.filter((e) => e.is_completed).reduce((s, e) => s + e.amount_pence, 0);
  const remaining = TOTAL_BUDGET - totalPlanned;

  const handleToggle = async (id: string, current: boolean) => {
    const result = await togglePlannedExpenseComplete(id, !current);
    if (!result.success) toast.error(result.error || "Failed");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Planned Expenses (2025–27)</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">Planned</span>
              <p className="font-semibold tabular-nums">{formatGBP(totalPlanned)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Budget</span>
              <p className="font-semibold tabular-nums">{formatGBP(TOTAL_BUDGET)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Buffer</span>
              <p className={cn("font-semibold tabular-nums", remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {formatGBP(remaining)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className={cn(expense.is_completed && "opacity-50")}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={expense.is_completed}
                    onChange={() => handleToggle(expense.id, expense.is_completed)}
                    className="h-4 w-4 rounded border-border"
                  />
                </TableCell>
                <TableCell className={cn("text-sm", expense.is_completed && "line-through")}>
                  {expense.name}
                  {expense.notes && (
                    <span className="block text-xs text-muted-foreground">{expense.notes}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{expense.expense_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[expense.priority] || ""}`}>
                    {expense.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{expense.target_year || "—"}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {formatGBP(expense.amount_pence)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
