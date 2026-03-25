import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectionsShell } from "@/components/projections/ProjectionsShell";
import type { PensionScenario } from "@/types";

interface ProjectionsData {
  currentPensionPence: number;
  currentIsaPence: number;
  currentInvestmentPence: number;
  latestMonth: string;
  scenarios: PensionScenario[];
  pensionAccountId: string | null;
}

async function fetchCategoryBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  category: string,
  latestMonth: string
): Promise<number> {
  const { data } = await supabase
    .from("monthly_snapshots")
    .select(
      "balance_pence, accounts!inner(category)"
    )
    .eq("accounts.category", category)
    .eq("month", latestMonth);

  if (!data || data.length === 0) return 0;
  return (data as unknown as { balance_pence: number }[]).reduce(
    (sum, row) => sum + row.balance_pence,
    0
  );
}

export default async function ProjectionsPage() {
  const supabase = await createClient();

  // Get latest month from snapshots
  const { data: latestRow } = await supabase
    .from("monthly_snapshots")
    .select("month")
    .order("month", { ascending: false })
    .limit(1);

  if (!latestRow || latestRow.length === 0) {
    return (
      <>
        <PageHeader
          title="Projections"
          description="Pension modelling and investment growth scenarios"
        />
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No snapshot data yet. Add monthly data first.
        </div>
      </>
    );
  }

  const latestMonth = latestRow[0].month;

  // Fetch balances for each category in parallel
  const [currentPensionPence, currentIsaPence, currentInvestmentPence] =
    await Promise.all([
      fetchCategoryBalance(supabase, "pension", latestMonth),
      fetchCategoryBalance(supabase, "isa", latestMonth),
      fetchCategoryBalance(supabase, "investment", latestMonth),
    ]);

  // Fetch saved pension scenarios
  const { data: scenarioRows } = await supabase
    .from("pension_scenarios")
    .select("*")
    .order("name", { ascending: true });

  const scenarios = (scenarioRows || []) as unknown as PensionScenario[];

  // Get the first pension account ID for saving scenarios
  const { data: pensionAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("category", "pension")
    .limit(1);

  const pensionAccountId =
    pensionAccounts && pensionAccounts.length > 0
      ? pensionAccounts[0].id
      : null;

  const projectionsData: ProjectionsData = {
    currentPensionPence,
    currentIsaPence,
    currentInvestmentPence,
    latestMonth,
    scenarios,
    pensionAccountId,
  };

  return (
    <>
      <PageHeader
        title="Projections"
        description="Pension modelling and investment growth scenarios"
      />
      <ProjectionsShell data={projectionsData} />
    </>
  );
}
