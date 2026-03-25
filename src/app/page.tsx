import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  transformSnapshots,
  toChartData,
  toMoMChanges,
  computeSummary,
  getLeafAccounts,
} from "@/lib/utils/dashboard";
import type { SnapshotWithAccount } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select(
      "id, account_id, month, balance_pence, accounts!inner(id, name, category, side, parent_account_id, display_order, is_active, notes)"
    )
    .order("month", { ascending: true });

  if (error) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Net worth overview and monthly tracking"
        />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load data: {error.message}
        </div>
      </>
    );
  }

  const rows = (data || []) as unknown as SnapshotWithAccount[];
  const months = transformSnapshots(rows);

  if (months.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Net worth overview and monthly tracking"
        />
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No data yet. Run the seed script or add your first month.
        </div>
      </>
    );
  }

  const chartData = toChartData(months);
  const momChanges = toMoMChanges(months);
  const summary = computeSummary(months);
  const accounts = getLeafAccounts(rows);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Net worth overview and monthly tracking"
      />
      <DashboardShell
        summary={summary}
        chartData={chartData}
        momChanges={momChanges}
        months={months}
        accounts={accounts}
      />
    </>
  );
}
