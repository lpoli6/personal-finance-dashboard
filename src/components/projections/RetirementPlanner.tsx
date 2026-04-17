"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  LineChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatGBP } from "@/lib/utils/currency";
import { Compass, Wallet, Timer, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetirementPlannerProps {
  currentIsaPence: number;
  currentInvestmentPence: number;
  currentPensionPence: number;
}

interface YearPoint {
  year: number;
  age: number;
  balanceNominal: number;
  balanceReal: number;
  withdrawalNominal: number;
  withdrawalReal: number;
  cumulativeWithdrawn: number;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

interface SimInputs {
  startingBalance: number; // pence
  annualReturnPct: number;
  inflationPct: number;
  swrPct: number;
  years: number;
  currentAge: number;
  startAge: number;
  monthlyContributionPence: number;
  fixedAnnual?: boolean; // if true, withdraw a fixed real amount per year (classic 4% rule)
}

/**
 * Simulate an accumulation + drawdown plan in nominal pence (computed annually).
 *
 * Classic SWR rule: withdraw `swrPct%` of the *starting* retirement balance on year 1,
 * and then inflate that withdrawal amount each subsequent year by `inflationPct%`.
 *
 * Phase 1: accumulation — from `currentAge` to `startAge`, contributing monthly and growing at `annualReturnPct`.
 * Phase 2: drawdown — from `startAge` onwards for `years` years, withdrawing & growing.
 */
function simulate(inputs: SimInputs): {
  points: YearPoint[];
  retirementBalance: number;
  firstYearWithdrawal: number;
  monthlyIncome: number;
  lastsUntilAge: number;
  runsOutAtYear: number | null;
} {
  const {
    startingBalance,
    annualReturnPct,
    inflationPct,
    swrPct,
    years,
    currentAge,
    startAge,
    monthlyContributionPence,
  } = inputs;

  const growth = 1 + annualReturnPct / 100;
  const infl = 1 + inflationPct / 100;
  const monthlyGrowth = annualReturnPct / 100 / 12;

  // --- accumulation ---
  let balance = startingBalance;
  const accumYears = Math.max(0, startAge - currentAge);
  const points: YearPoint[] = [];
  for (let y = 0; y < accumYears; y++) {
    // Monthly compounding + contributions for one year
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyGrowth) + monthlyContributionPence;
    }
    const age = currentAge + y + 1;
    points.push({
      year: y + 1,
      age,
      balanceNominal: Math.round(balance),
      balanceReal: Math.round(balance / Math.pow(infl, y + 1)),
      withdrawalNominal: 0,
      withdrawalReal: 0,
      cumulativeWithdrawn: 0,
    });
  }

  const retirementBalance = Math.round(balance);

  // --- drawdown ---
  // Classic 4% rule: withdrawal in year-1 real terms fixed
  const firstYearWithdrawal = Math.round(retirementBalance * (swrPct / 100));
  let cumWithdrawn = 0;
  let runsOutAtYear: number | null = null;

  for (let y = 0; y < years; y++) {
    const nominalWithdrawal = Math.round(firstYearWithdrawal * Math.pow(infl, y));
    // Withdraw at start of year
    balance = balance - nominalWithdrawal;
    // Grow remainder
    balance = balance * growth;
    if (balance < 0) {
      balance = 0;
      if (runsOutAtYear === null) runsOutAtYear = accumYears + y + 1;
    }
    cumWithdrawn += nominalWithdrawal;

    const age = startAge + y + 1;
    points.push({
      year: accumYears + y + 1,
      age,
      balanceNominal: Math.round(balance),
      balanceReal: Math.round(balance / Math.pow(infl, accumYears + y + 1)),
      withdrawalNominal: nominalWithdrawal,
      withdrawalReal: Math.round(nominalWithdrawal / Math.pow(infl, accumYears + y + 1)),
      cumulativeWithdrawn: Math.round(cumWithdrawn),
    });
  }

  return {
    points,
    retirementBalance,
    firstYearWithdrawal,
    monthlyIncome: Math.round(firstYearWithdrawal / 12),
    lastsUntilAge: startAge + years,
    runsOutAtYear,
  };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function formatCompact(pence: number): string {
  const p = pence / 100;
  const abs = Math.abs(p);
  if (abs >= 1_000_000) return `£${(p / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `£${(p / 1_000).toFixed(0)}k`;
  return `£${p.toFixed(0)}`;
}

function parsePoundsInput(value: string): number {
  const cleaned = value.replace(/[£,\s]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function penceToPoundsStr(pence: number): string {
  return (pence / 100).toFixed(0);
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className={cn("text-sm font-semibold tabular-nums", accent ?? "text-foreground")}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-emerald-500"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/70">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", accent ?? "bg-muted text-muted-foreground")}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RetirementPlanner({
  currentIsaPence,
  currentInvestmentPence,
  currentPensionPence,
}: RetirementPlannerProps) {
  const defaultStarting = currentIsaPence + currentInvestmentPence + currentPensionPence;

  const [startingStr, setStartingStr] = useState(penceToPoundsStr(defaultStarting));
  const [startingPence, setStartingPence] = useState(defaultStarting);
  const [monthlyContribStr, setMonthlyContribStr] = useState("1500");
  const [monthlyContribPence, setMonthlyContribPence] = useState(150_000);

  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(55);
  const [years, setYears] = useState(30);
  const [swrPct, setSwrPct] = useState(4);
  const [annualReturnPct, setAnnualReturnPct] = useState(7);
  const [inflationPct, setInflationPct] = useState(2.5);

  const sim = useMemo(
    () =>
      simulate({
        startingBalance: startingPence,
        annualReturnPct,
        inflationPct,
        swrPct,
        years,
        currentAge,
        startAge: retireAge,
        monthlyContributionPence: monthlyContribPence,
      }),
    [
      startingPence,
      annualReturnPct,
      inflationPct,
      swrPct,
      years,
      currentAge,
      retireAge,
      monthlyContribPence,
    ]
  );

  // "Right now" snapshot — as if you retired today
  const todaySim = useMemo(
    () =>
      simulate({
        startingBalance: startingPence,
        annualReturnPct,
        inflationPct,
        swrPct,
        years,
        currentAge,
        startAge: currentAge, // retire immediately
        monthlyContributionPence: 0,
      }),
    [startingPence, annualReturnPct, inflationPct, swrPct, years, currentAge]
  );

  const ageAxis = sim.points.map((p) => ({
    ...p,
    ageLabel: p.age,
  }));

  const handleStartingBlur = () => {
    const pence = parsePoundsInput(startingStr);
    setStartingPence(pence);
    setStartingStr(penceToPoundsStr(pence));
  };
  const handleContribBlur = () => {
    const pence = parsePoundsInput(monthlyContribStr);
    setMonthlyContribPence(pence);
    setMonthlyContribStr(penceToPoundsStr(pence));
  };

  return (
    <div className="space-y-6">
      {/* Hero result card */}
      <div className="hero-ring mesh-accent relative overflow-hidden rounded-2xl bg-card/40 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500">
                Safe withdrawal plan
              </p>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Monthly income at age {retireAge}
            </p>
            <p className="rise font-display text-5xl lg:text-6xl font-semibold tracking-tight mt-1 tabular-nums glow-accent">
              {formatGBP(sim.monthlyIncome)}
            </p>
            <p className="text-sm text-muted-foreground mt-3 max-w-lg">
              A {swrPct}% withdrawal over {years} years from a retirement pot of{" "}
              <span className="text-foreground font-medium tabular-nums">
                {formatGBP(sim.retirementBalance)}
              </span>
              . Adjusted annually for {inflationPct}% inflation.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                If you stopped today
              </p>
              <p className="text-xl font-semibold tabular-nums mt-1">
                {formatGBP(todaySim.monthlyIncome)}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                for {years} years · inflation-adjusted
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                First-year withdrawal
              </p>
              <p className="text-xl font-semibold tabular-nums mt-1">
                {formatGBP(sim.firstYearWithdrawal)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                annually · {swrPct}% of pot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatPill
          icon={Wallet}
          label="Pot at retirement"
          value={formatGBP(sim.retirementBalance)}
          sub={`${retireAge - currentAge} years of accumulation`}
          accent="bg-emerald-500/10 text-emerald-500"
        />
        <StatPill
          icon={Timer}
          label="Income lasts until"
          value={sim.runsOutAtYear === null ? `Age ${sim.lastsUntilAge}+` : `Age ${currentAge + sim.runsOutAtYear}`}
          sub={sim.runsOutAtYear === null ? "Plan succeeds" : "Pot depleted earlier than target"}
          accent={sim.runsOutAtYear === null ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}
        />
        <StatPill
          icon={TrendingDown}
          label="Real return"
          value={`${(annualReturnPct - inflationPct).toFixed(1)}%`}
          sub={`${annualReturnPct}% nominal, ${inflationPct}% inflation`}
          accent="bg-indigo-500/10 text-indigo-400"
        />
        <StatPill
          icon={Compass}
          label="Replacement rate"
          value={`${((sim.firstYearWithdrawal / Math.max(1, monthlyContribPence * 12)) * 100).toFixed(0)}%`}
          sub="vs current annual contributions"
          accent="bg-amber-500/10 text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Controls */}
        <Card className="rounded-2xl border-border bg-card/40 p-6">
          <CardContent className="p-0 space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
                Your starting point
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Investable today (£)
                  </label>
                  <Input
                    value={startingStr}
                    onChange={(e) => setStartingStr(e.target.value)}
                    onBlur={handleStartingBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleStartingBlur()}
                    inputMode="numeric"
                    className="mt-1.5 h-9 tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground/70 mt-1 tabular-nums">
                    auto-filled from ISA + GIA + Pension ({formatCompact(defaultStarting)})
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Monthly contribution (£)
                  </label>
                  <Input
                    value={monthlyContribStr}
                    onChange={(e) => setMonthlyContribStr(e.target.value)}
                    onBlur={handleContribBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleContribBlur()}
                    inputMode="numeric"
                    className="mt-1.5 h-9 tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
                Plan
              </p>
              <div className="space-y-5">
                <Slider
                  label="Current age"
                  value={currentAge}
                  onChange={setCurrentAge}
                  min={18}
                  max={80}
                  step={1}
                />
                <Slider
                  label="Retire at"
                  value={retireAge}
                  onChange={(v) => setRetireAge(Math.max(v, currentAge))}
                  min={Math.max(currentAge, 30)}
                  max={85}
                  step={1}
                />
                <Slider
                  label="Drawdown length (years)"
                  value={years}
                  onChange={setYears}
                  min={10}
                  max={50}
                  step={1}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
                Markets & inflation
              </p>
              <div className="space-y-5">
                <Slider
                  label="Safe withdrawal rate"
                  value={swrPct}
                  onChange={setSwrPct}
                  min={2}
                  max={7}
                  step={0.25}
                  suffix="%"
                  accent="text-emerald-500"
                />
                <Slider
                  label="Annual return (nominal)"
                  value={annualReturnPct}
                  onChange={setAnnualReturnPct}
                  min={2}
                  max={12}
                  step={0.25}
                  suffix="%"
                />
                <Slider
                  label="Inflation"
                  value={inflationPct}
                  onChange={setInflationPct}
                  min={0}
                  max={8}
                  step={0.25}
                  suffix="%"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="rounded-2xl border-border bg-card/40 p-6 flex flex-col">
          <CardContent className="p-0 flex flex-col flex-1 gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Portfolio path
                </p>
                <p className="text-sm text-muted-foreground/80 mt-1">
                  Accumulate → retire at {retireAge} → draw {swrPct}% per year
                </p>
              </div>
              <div className="flex gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Nominal
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" /> Real
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={ageAxis}
                margin={{ top: 6, right: 12, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="balNominal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="balReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 10, fill: "#6b6b6b" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 10, fill: "#6b6b6b" }}
                  width={56}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: "#262626", strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as YearPoint;
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur text-[#ededed] p-3 shadow-2xl text-xs min-w-[200px]">
                        <p className="font-semibold text-[13px]">Age {label}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-6">
                            <span className="text-[#8a8a8a]">Balance (nominal)</span>
                            <span className="tabular-nums font-medium">{formatGBP(p.balanceNominal)}</span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="text-[#8a8a8a]">Balance (real)</span>
                            <span className="tabular-nums font-medium">{formatGBP(p.balanceReal)}</span>
                          </div>
                          {p.withdrawalNominal > 0 && (
                            <div className="flex justify-between gap-6 pt-1 border-t border-white/[0.06]">
                              <span className="text-[#8a8a8a]">Withdrawal this yr</span>
                              <span className="tabular-nums font-medium text-amber-400">
                                {formatGBP(p.withdrawalNominal)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={retireAge}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: "Retire",
                    position: "insideTop",
                    fill: "#10b981",
                    fontSize: 10,
                    offset: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balanceNominal"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#balNominal)"
                  animationDuration={700}
                />
                <Area
                  type="monotone"
                  dataKey="balanceReal"
                  stroke="#818cf8"
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  fill="url(#balReal)"
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Mini withdrawal curve */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Annual withdrawal (inflation-adjusted nominal £)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Starts at{" "}
                  <span className="tabular-nums text-foreground font-medium">
                    {formatGBP(sim.firstYearWithdrawal)}
                  </span>
                </p>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={ageAxis.filter((p) => p.withdrawalNominal > 0)}>
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 9, fill: "#6b6b6b" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null;
                      const v = payload[0].value as number;
                      return (
                        <div className="rounded-md border border-white/[0.06] bg-[#0f0f0f]/95 px-2 py-1 text-[11px] text-[#ededed]">
                          Age {label}: <span className="tabular-nums font-medium">{formatGBP(v)}</span>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="withdrawalNominal"
                    stroke="#fbbf24"
                    strokeWidth={1.75}
                    dot={false}
                    animationDuration={700}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="rounded-2xl border-border bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">How this works</CardTitle>
          <CardDescription>
            A simplified Trinity-study-style model for planning purposes only.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="text-foreground font-medium">Accumulation.</span> Each month we
            add your contribution and apply {(annualReturnPct / 12).toFixed(2)}% growth
            (annual return ÷ 12).
          </p>
          <p>
            <span className="text-foreground font-medium">Drawdown.</span> At retirement we
            withdraw {swrPct}% of the pot in year one. Each subsequent year the
            withdrawal is uplifted by {inflationPct}% to preserve real purchasing power.
            The remainder grows at {annualReturnPct}%.
          </p>
          <p>
            Historic research (Trinity / Bengen) shows a 4% rate has survived nearly all
            rolling 30-year US stock/bond periods. Lower rates (3–3.5%) are safer for
            longer retirements or lower return assumptions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
