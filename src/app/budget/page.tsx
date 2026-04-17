import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetShell } from "@/components/budget/BudgetShell";
import type { BudgetItem, PlannedExpense } from "@/types";

export default async function BudgetPage() {
  const supabase = await createClient();

  const [{ data: budgetItems, error: bErr }, { data: plannedExpenses, error: pErr }] =
    await Promise.all([
      supabase.from("budget_items").select("*").order("display_order"),
      supabase.from("planned_expenses").select("*").order("amount_pence", { ascending: false }),
    ]);

  if (bErr || pErr) {
    return (
      <>
        <PageHeader eyebrow="Plan" title="Budget" description="Monthly budget overview and future planning" />
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load: {bErr?.message || pErr?.message}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Monthly budget"
        description="Every pound allocated — set where your take-home flows, and track upcoming planned expenses."
      />
      <BudgetShell
        budgetItems={(budgetItems || []) as BudgetItem[]}
        plannedExpenses={(plannedExpenses || []) as PlannedExpense[]}
      />
    </>
  );
}
