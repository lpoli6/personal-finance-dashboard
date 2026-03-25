"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { saveScenario, deleteScenario } from "@/app/actions/projections";
import { CATEGORY_COLORS } from "@/lib/constants/chart-colors";
import type { PensionScenario, ProjectionYear } from "@/types";

// ---------- Helpers ----------

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `\u00A3${(pounds / 1_000_000).toFixed(1)}M`;
  if (pounds >= 1_000) return `\u00A3${(pounds / 1_000).toFixed(0)}k`;
  return `\u00A3${pounds.toFixed(0)}`;
}

function formatMonth(monthStr: string): string {
  const d = new Date(monthStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function calculateProjection(params: {
  startingBalance: number;
  monthlyContribution: number;
  annualReturnPct: number;
  currentAge: number;
  retirementAge: number;
  inflationPct: number;
}): ProjectionYear[] {
  const {
    startingBalance,
    monthlyContribution,
    annualReturnPct,
    currentAge,
    retirementAge,
    inflationPct,
  } = params;
  const years = retirementAge - currentAge;
  const monthlyRate = annualReturnPct / 100 / 12;
  let balance = startingBalance;
  const results: ProjectionYear[] = [];

  for (let year = 0; year <= years; year++) {
    const cumulativeContributions =
      startingBalance + monthlyContribution * 12 * year;
    const growth = balance - cumulativeContributions;
    const realValue = balance / Math.pow(1 + inflationPct / 100, year);

    results.push({
      year,
      age: currentAge + year,
      nominalValue: balance,
      realValue,
      cumulativeContributions,
      growth,
    });

    // Compound monthly for next year
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
  }
  return results;
}

// ---------- Scenario chart colours ----------

const SCENARIO_COLORS = [
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

// ---------- Props ----------

interface PensionModellerProps {
  currentPensionPence: number;
  latestMonth: string;
  scenarios: PensionScenario[];
  pensionAccountId: string | null;
}

// ---------- Component ----------

export function PensionModeller({
  currentPensionPence,
  latestMonth,
  scenarios: initialScenarios,
  pensionAccountId,
}: PensionModellerProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Controls state
  const [overrideBalance, setOverrideBalance] = useState<string>("");
  const [monthlyEmployee, setMonthlyEmployee] = useState(50000);
  const [monthlyEmployer, setMonthlyEmployer] = useState(50000);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [retirementAge, setRetirementAge] = useState(57);
  const [currentAge, setCurrentAge] = useState(29);
  const [inflationRate, setInflationRate] = useState(2.5);

  // Scenario state
  const [savingName, setSavingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [showTable, setShowTable] = useState(false);

  // Effective starting balance
  const startingBalance = overrideBalance
    ? Math.round(parseFloat(overrideBalance) * 100)
    : currentPensionPence;

  // Main projection
  const projection = useMemo(
    () =>
      calculateProjection({
        startingBalance,
        monthlyContribution: monthlyEmployee + monthlyEmployer,
        annualReturnPct: annualReturn,
        currentAge,
        retirementAge,
        inflationPct: inflationRate,
      }),
    [
      startingBalance,
      monthlyEmployee,
      monthlyEmployer,
      annualReturn,
      currentAge,
      retirementAge,
      inflationRate,
    ]
  );

  // Scenario projections for overlay
  const scenarioProjections = useMemo(() => {
    return initialScenarios
      .filter((s) => selectedScenarioIds.includes(s.id))
      .map((s) => ({
        scenario: s,
        data: calculateProjection({
          startingBalance,
          monthlyContribution:
            s.monthly_contribution_pence + s.employer_contribution_pence,
          annualReturnPct: s.annual_return_pct,
          currentAge,
          retirementAge: s.retirement_age,
          inflationPct: s.inflation_rate_pct,
        }),
      }));
  }, [initialScenarios, selectedScenarioIds, startingBalance, currentAge]);

  // Summary values
  const lastYear = projection[projection.length - 1];
  const totalContributions = lastYear?.cumulativeContributions ?? 0;
  const nominalAtRetirement = lastYear?.nominalValue ?? 0;
  const realAtRetirement = lastYear?.realValue ?? 0;
  const totalGrowth = lastYear?.growth ?? 0;

  // Chart data — merge main + scenarios
  const chartData = useMemo(() => {
    return projection.map((p, idx) => {
      const row: Record<string, number> = {
        age: p.age,
        year: p.year,
        nominal: p.nominalValue,
        real: p.realValue,
      };
      scenarioProjections.forEach((sp) => {
        if (idx < sp.data.length) {
          row[`scenario_${sp.scenario.id}`] = sp.data[idx].nominalValue;
        }
      });
      return row;
    });
  }, [projection, scenarioProjections]);

  // Chart colours
  const nominalColor = isDark
    ? CATEGORY_COLORS.pension.dark
    : CATEGORY_COLORS.pension.light;
  const realColor = isDark ? "#94a3b8" : "#64748b";

  // Handlers
  const handleSaveScenario = useCallback(async () => {
    if (!pensionAccountId) {
      toast.error("No pension account found. Create one first.");
      return;
    }
    if (!savingName.trim()) {
      toast.error("Please enter a scenario name.");
      return;
    }
    setIsSaving(true);
    const result = await saveScenario({
      name: savingName.trim(),
      account_id: pensionAccountId,
      monthly_contribution_pence: monthlyEmployee,
      employer_contribution_pence: monthlyEmployer,
      annual_return_pct: annualReturn,
      retirement_age: retirementAge,
      inflation_rate_pct: inflationRate,
    });
    setIsSaving(false);
    if (result.success) {
      toast.success(`Scenario "${savingName}" saved.`);
      setSavingName("");
      setShowSaveForm(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save scenario.");
    }
  }, [
    pensionAccountId,
    savingName,
    monthlyEmployee,
    monthlyEmployer,
    annualReturn,
    retirementAge,
    inflationRate,
    router,
  ]);

  const handleDeleteScenario = useCallback(
    async (id: string, name: string) => {
      const result = await deleteScenario(id);
      if (result.success) {
        toast.success(`Scenario "${name}" deleted.`);
        setSelectedScenarioIds((prev) => prev.filter((sid) => sid !== id));
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete scenario.");
      }
    },
    [router]
  );

  const toggleScenario = useCallback((id: string) => {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  // Custom tooltip
  function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-md text-sm min-w-[200px]">
        <p className="font-semibold mb-2">
          Age {d.age} (Year {d.year})
        </p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Nominal</span>
            <span className="font-medium tabular-nums">
              {formatGBP(d.nominal)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Real</span>
            <span className="font-medium tabular-nums">
              {formatGBP(d.real)}
            </span>
          </div>
          {scenarioProjections.map((sp, i) => {
            const key = `scenario_${sp.scenario.id}`;
            if (d[key] == null) return null;
            return (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {sp.scenario.name}
                </span>
                <span className="font-medium tabular-nums">
                  {formatGBP(d[key])}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      {/* Left column — Controls */}
      <div className="lg:col-span-1 space-y-4">
        {/* Current Value */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pension</CardTitle>
            <CardDescription>as of {formatMonth(latestMonth)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold tracking-tight">
              {formatGBP(currentPensionPence)}
            </p>
            <div>
              <label className="text-xs text-muted-foreground">
                Override starting balance (&pound;)
              </label>
              <Input
                type="number"
                placeholder="Leave blank to use current"
                value={overrideBalance}
                onChange={(e) => setOverrideBalance(e.target.value)}
                min={0}
                step={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contributions */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Contributions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">
                Employee ({formatGBP(monthlyEmployee)}/mo)
              </label>
              <Input
                type="number"
                value={monthlyEmployee}
                onChange={(e) =>
                  setMonthlyEmployee(Math.max(0, parseInt(e.target.value) || 0))
                }
                min={0}
                step={5000}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Employer ({formatGBP(monthlyEmployer)}/mo)
              </label>
              <Input
                type="number"
                value={monthlyEmployer}
                onChange={(e) =>
                  setMonthlyEmployer(Math.max(0, parseInt(e.target.value) || 0))
                }
                min={0}
                step={5000}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {formatGBP(monthlyEmployee + monthlyEmployer)}/mo (
              {formatGBP((monthlyEmployee + monthlyEmployer) * 12)}/yr)
            </p>
          </CardContent>
        </Card>

        {/* Return & Age */}
        <Card>
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Annual return */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">
                  Annual return
                </label>
                <span className="text-sm font-medium tabular-nums">
                  {annualReturn.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={annualReturn}
                onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
              />
              <div className="flex gap-1.5 mt-2">
                {[
                  { label: "Conservative", value: 4 },
                  { label: "Moderate", value: 6 },
                  { label: "Aggressive", value: 8 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    size="xs"
                    variant={
                      annualReturn === preset.value ? "default" : "outline"
                    }
                    onClick={() => setAnnualReturn(preset.value)}
                  >
                    {preset.label} ({preset.value}%)
                  </Button>
                ))}
              </div>
            </div>

            {/* Retirement age */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">
                  Retirement age
                </label>
                <span className="text-sm font-medium tabular-nums">
                  {retirementAge}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={68}
                step={1}
                value={retirementAge}
                onChange={(e) =>
                  setRetirementAge(parseInt(e.target.value))
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
              />
            </div>

            {/* Current age */}
            <div>
              <label className="text-xs text-muted-foreground">
                Current age
              </label>
              <Input
                type="number"
                value={currentAge}
                onChange={(e) =>
                  setCurrentAge(
                    Math.max(18, Math.min(67, parseInt(e.target.value) || 18))
                  )
                }
                min={18}
                max={67}
              />
            </div>

            {/* Inflation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">
                  Inflation rate
                </label>
                <span className="text-sm font-medium tabular-nums">
                  {inflationRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Scenarios</CardTitle>
            <CardDescription>
              Save and compare different assumptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Save button / form */}
            {!showSaveForm ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowSaveForm(true)}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Current Scenario
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Scenario name"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveScenario();
                    if (e.key === "Escape") {
                      setShowSaveForm(false);
                      setSavingName("");
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveScenario}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowSaveForm(false);
                      setSavingName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Scenario list */}
            {initialScenarios.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">
                  Toggle to compare on chart:
                </p>
                {initialScenarios.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <button
                      className={cn(
                        "flex items-center gap-2 text-sm text-left flex-1 px-2 py-1 rounded-md transition-colors",
                        selectedScenarioIds.includes(s.id)
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleScenario(s.id)}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          background:
                            SCENARIO_COLORS[i % SCENARIO_COLORS.length],
                          opacity: selectedScenarioIds.includes(s.id)
                            ? 1
                            : 0.3,
                        }}
                      />
                      <span className="truncate">{s.name}</span>
                    </button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleDeleteScenario(s.id, s.name)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column — Chart + Summary + Table */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Projected (Nominal)
              </p>
              <p className="text-lg font-bold tracking-tight mt-1 tabular-nums">
                {formatGBP(nominalAtRetirement)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Projected (Real)
              </p>
              <p className="text-lg font-bold tracking-tight mt-1 tabular-nums">
                {formatGBP(realAtRetirement)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Total Contributions
              </p>
              <p className="text-lg font-bold tracking-tight mt-1 tabular-nums">
                {formatGBP(totalContributions)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Growth from Returns
              </p>
              <p className="text-lg font-bold tracking-tight mt-1 tabular-nums text-green-600 dark:text-green-400">
                {formatGBP(totalGrowth)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pension Growth Projection</CardTitle>
            <CardDescription>
              Age {currentAge} to {retirementAge} &mdash;{" "}
              {retirementAge - currentAge} years at {annualReturn}% annual return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="nominalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={nominalColor}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={nominalColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="realGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={realColor}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={realColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Age",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                  }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 11 }}
                  width={70}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="line"
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="nominal"
                  name="Nominal"
                  stroke={nominalColor}
                  fill="url(#nominalGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Real (Inflation-Adjusted)"
                  stroke={realColor}
                  fill="url(#realGradient)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
                {scenarioProjections.map((sp, i) => (
                  <Area
                    key={sp.scenario.id}
                    type="monotone"
                    dataKey={`scenario_${sp.scenario.id}`}
                    name={sp.scenario.name}
                    stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Year-by-year table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Year-by-Year Breakdown</CardTitle>
                <CardDescription>
                  Detailed projection from age {currentAge} to {retirementAge}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTable(!showTable)}
              >
                {showTable ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showTable && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Contributions</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                    <TableHead className="text-right">
                      Nominal Value
                    </TableHead>
                    <TableHead className="text-right">Real Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projection.map((row) => {
                    const isRetirement = row.age === retirementAge;
                    return (
                      <TableRow
                        key={row.year}
                        className={cn(
                          isRetirement &&
                            "bg-primary/5 font-semibold border-primary/20"
                        )}
                      >
                        <TableCell>{row.year}</TableCell>
                        <TableCell>
                          {row.age}
                          {isRetirement && (
                            <span className="ml-1.5 text-xs text-primary">
                              Retire
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatGBP(row.cumulativeContributions)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                          {formatGBP(row.growth)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatGBP(row.nominalValue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatGBP(row.realValue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
