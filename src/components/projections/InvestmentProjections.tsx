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
  Legend,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatGBP } from "@/lib/utils/currency";
import { CATEGORY_COLORS } from "@/lib/constants/chart-colors";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvestmentProjectionsProps {
  currentIsaPence: number;
  currentInvestmentPence: number; // GIA
  currentPensionPence: number;
}

interface ChartDataPoint {
  year: number;
  isa: number;
  investment: number;
  pension: number;
  total: number;
}

interface TableProjection {
  pot: "isa" | "investment" | "pension";
  label: string;
  values: Record<number, number>; // years → pence
}

interface RateBlock {
  rate: number;
  pots: TableProjection[];
  totals: Record<number, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RETURN_RATES = [6, 8, 10] as const;
const HORIZONS = [5, 10, 15, 20] as const;
const DEFAULT_ISA_MONTHLY_PENCE = 50_000; // £500
const DEFAULT_GIA_MONTHLY_PENCE = 0;
const DEFAULT_PENSION_MONTHLY_PENCE = 100_000; // £1,000

const MILESTONES_PENCE = [
  50_000_000, // £500k
  100_000_000, // £1M
  200_000_000, // £2M
] as const;

const POTS = [
  { key: "isa" as const, label: "ISA" },
  { key: "investment" as const, label: "GIA" },
  { key: "pension" as const, label: "Pension" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function projectPot(
  startPence: number,
  monthlyPence: number,
  annualPct: number,
  years: number
): number {
  const monthlyRate = annualPct / 100 / 12;
  let balance = startPence;
  for (let m = 0; m < years * 12; m++) {
    balance = balance * (1 + monthlyRate) + monthlyPence;
  }
  return Math.round(balance);
}

function formatCompact(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

/**
 * Parse a GBP pounds string (typed into the input) into pence.
 * Accepts "500", "1,000", "£500", etc. Returns 0 for invalid input.
 */
function parsePoundsInput(value: string): number {
  const cleaned = value.replace(/[£,\s]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/**
 * Format pence as a simple pounds number string for the input field.
 */
function penceToPoundsStr(pence: number): string {
  return (pence / 100).toFixed(0);
}

/**
 * Find the first year (out of 20) when total balance crosses a milestone.
 * Returns the year number, or null if never reached.
 */
function findMilestoneYear(
  chartData: ChartDataPoint[],
  milestonePence: number
): number | null {
  for (const point of chartData) {
    if (point.total >= milestonePence) {
      return point.year;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvestmentProjections({
  currentIsaPence,
  currentInvestmentPence,
  currentPensionPence,
}: InvestmentProjectionsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ---- State: monthly contributions (stored as pence) ----
  const [isaMonthlyPence, setIsaMonthlyPence] = useState(
    DEFAULT_ISA_MONTHLY_PENCE
  );
  const [giaMonthlyPence, setGiaMonthlyPence] = useState(
    DEFAULT_GIA_MONTHLY_PENCE
  );
  const [pensionMonthlyPence, setPensionMonthlyPence] = useState(
    DEFAULT_PENSION_MONTHLY_PENCE
  );

  // ---- State: return rate for chart (default 7%) ----
  const [chartRate, setChartRate] = useState(7);

  // ---- Input display strings (so user can type freely) ----
  const [isaInputStr, setIsaInputStr] = useState(
    penceToPoundsStr(DEFAULT_ISA_MONTHLY_PENCE)
  );
  const [giaInputStr, setGiaInputStr] = useState(
    penceToPoundsStr(DEFAULT_GIA_MONTHLY_PENCE)
  );
  const [pensionInputStr, setPensionInputStr] = useState(
    penceToPoundsStr(DEFAULT_PENSION_MONTHLY_PENCE)
  );

  // ---- Table projections ----
  const tableData: RateBlock[] = useMemo(() => {
    return RETURN_RATES.map((rate) => {
      const pots: TableProjection[] = POTS.map(({ key, label }) => {
        const start =
          key === "isa"
            ? currentIsaPence
            : key === "investment"
              ? currentInvestmentPence
              : currentPensionPence;
        const monthly =
          key === "isa"
            ? isaMonthlyPence
            : key === "investment"
              ? giaMonthlyPence
              : pensionMonthlyPence;
        const values: Record<number, number> = {};
        for (const h of HORIZONS) {
          values[h] = projectPot(start, monthly, rate, h);
        }
        return { pot: key, label, values };
      });

      const totals: Record<number, number> = {};
      for (const h of HORIZONS) {
        totals[h] = pots.reduce((sum, p) => sum + p.values[h], 0);
      }

      return { rate, pots, totals };
    });
  }, [
    currentIsaPence,
    currentInvestmentPence,
    currentPensionPence,
    isaMonthlyPence,
    giaMonthlyPence,
    pensionMonthlyPence,
  ]);

  // ---- Chart data: yearly data points for 0-20 years at chartRate ----
  const chartData: ChartDataPoint[] = useMemo(() => {
    const points: ChartDataPoint[] = [];
    for (let year = 0; year <= 20; year++) {
      const isa = projectPot(currentIsaPence, isaMonthlyPence, chartRate, year);
      const investment = projectPot(
        currentInvestmentPence,
        giaMonthlyPence,
        chartRate,
        year
      );
      const pension = projectPot(
        currentPensionPence,
        pensionMonthlyPence,
        chartRate,
        year
      );
      points.push({
        year,
        isa,
        investment,
        pension,
        total: isa + investment + pension,
      });
    }
    return points;
  }, [
    currentIsaPence,
    currentInvestmentPence,
    currentPensionPence,
    isaMonthlyPence,
    giaMonthlyPence,
    pensionMonthlyPence,
    chartRate,
  ]);

  // ---- Milestone years ----
  const milestones = useMemo(() => {
    return MILESTONES_PENCE.map((m) => ({
      pence: m,
      label: formatCompact(m),
      year: findMilestoneYear(chartData, m),
    }));
  }, [chartData]);

  // ---- Chart colors ----
  const isaColor = isDark
    ? CATEGORY_COLORS.isa.dark
    : CATEGORY_COLORS.isa.light;
  const giaColor = isDark
    ? CATEGORY_COLORS.investment.dark
    : CATEGORY_COLORS.investment.light;
  const pensionColor = isDark
    ? CATEGORY_COLORS.pension.dark
    : CATEGORY_COLORS.pension.light;

  // ---- Handlers ----
  function handleIsaBlur() {
    const pence = parsePoundsInput(isaInputStr);
    setIsaMonthlyPence(pence);
    setIsaInputStr(penceToPoundsStr(pence));
  }

  function handleGiaBlur() {
    const pence = parsePoundsInput(giaInputStr);
    setGiaMonthlyPence(pence);
    setGiaInputStr(penceToPoundsStr(pence));
  }

  function handlePensionBlur() {
    const pence = parsePoundsInput(pensionInputStr);
    setPensionMonthlyPence(pence);
    setPensionInputStr(penceToPoundsStr(pence));
  }

  function handleRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChartRate(Number(e.target.value));
  }

  return (
    <div className="space-y-6">
      {/* ---- Controls ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Projections</CardTitle>
          <CardDescription>
            Combined ISA, GIA and Pension growth modelling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* ISA Monthly */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                ISA monthly (£)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={isaInputStr}
                onChange={(e) => setIsaInputStr(e.target.value)}
                onBlur={handleIsaBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleIsaBlur();
                }}
              />
            </div>

            {/* GIA Monthly */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                GIA monthly (£)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={giaInputStr}
                onChange={(e) => setGiaInputStr(e.target.value)}
                onBlur={handleGiaBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGiaBlur();
                }}
              />
            </div>

            {/* Pension Monthly */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Pension monthly (£)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={pensionInputStr}
                onChange={(e) => setPensionInputStr(e.target.value)}
                onBlur={handlePensionBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePensionBlur();
                }}
              />
            </div>

            {/* Return Rate Slider */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Chart return rate: {chartRate}%
              </label>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={chartRate}
                onChange={handleRateChange}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2%</span>
                <span>12%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Stacked Area Chart ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Wealth Growth at {chartRate}% Return</CardTitle>
          <CardDescription>
            Combined investment pot growth over 20 years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="isaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isaColor} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={isaColor} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="giaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={giaColor} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={giaColor} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="pensionGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={pensionColor}
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor={pensionColor}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                label={{
                  value: "Year",
                  position: "insideBottomRight",
                  offset: -5,
                  fontSize: 11,
                }}
              />
              <YAxis
                tickFormatter={formatCompact}
                tick={{ fontSize: 11 }}
                width={70}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as ChartDataPoint;
                  return (
                    <div className="rounded-lg border bg-card p-3 shadow-md text-sm">
                      <p className="font-semibold mb-2">Year {label}</p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: isaColor }}
                          />
                          <span className="text-muted-foreground">ISA</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatGBP(d.isa)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: giaColor }}
                          />
                          <span className="text-muted-foreground">GIA</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatGBP(d.investment)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: pensionColor }}
                          />
                          <span className="text-muted-foreground">Pension</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatGBP(d.pension)}
                        </span>
                      </div>
                      <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">
                          {formatGBP(d.total)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />

              {/* Milestone reference lines */}
              {milestones.map(({ pence, label, year }) => (
                <ReferenceLine
                  key={pence}
                  y={pence}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  strokeDasharray="6 4"
                  label={{
                    value:
                      year !== null ? `${label} (Year ${year})` : `${label}`,
                    position: "right",
                    fontSize: 11,
                    fill: isDark ? "#94a3b8" : "#64748b",
                  }}
                />
              ))}

              <Area
                type="monotone"
                dataKey="pension"
                name="Pension"
                stackId="1"
                stroke={pensionColor}
                fill="url(#pensionGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="investment"
                name="GIA"
                stackId="1"
                stroke={giaColor}
                fill="url(#giaGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="isa"
                name="ISA"
                stackId="1"
                stroke={isaColor}
                fill="url(#isaGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ---- Projection Table ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Projection Table</CardTitle>
          <CardDescription>
            Future values at 6%, 8% and 10% annual returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]" />
                {HORIZONS.map((h) => (
                  <TableHead key={h} className="text-right">
                    {h} Years
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((block) => (
                <>
                  {/* Rate header row */}
                  <TableRow
                    key={`rate-${block.rate}`}
                    className="bg-muted/30 hover:bg-muted/30"
                  >
                    <TableCell
                      colSpan={HORIZONS.length + 1}
                      className="font-semibold text-foreground"
                    >
                      At {block.rate}% return
                    </TableCell>
                  </TableRow>

                  {/* Individual pot rows */}
                  {block.pots.map((pot) => (
                    <TableRow key={`${block.rate}-${pot.pot}`}>
                      <TableCell className="pl-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              background: isDark
                                ? CATEGORY_COLORS[pot.pot].dark
                                : CATEGORY_COLORS[pot.pot].light,
                            }}
                          />
                          {pot.label}
                        </div>
                      </TableCell>
                      {HORIZONS.map((h) => (
                        <TableCell
                          key={h}
                          className="text-right tabular-nums"
                        >
                          {formatGBP(pot.values[h])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Total row */}
                  <TableRow
                    key={`total-${block.rate}`}
                    className="border-b-2"
                  >
                    <TableCell className="pl-6 font-semibold text-foreground">
                      Total
                    </TableCell>
                    {HORIZONS.map((h) => (
                      <TableCell
                        key={h}
                        className="text-right font-semibold tabular-nums"
                      >
                        {formatGBP(block.totals[h])}
                      </TableCell>
                    ))}
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---- Current Starting Balances ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Starting Balances</CardTitle>
          <CardDescription>
            Current pot values used as projection starting points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ISA</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatGBP(currentIsaPence)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">GIA</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatGBP(currentInvestmentPence)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pension</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatGBP(currentPensionPence)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
