"use client";

import { useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { NetWorthChart } from "./NetWorthChart";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { MoMChangeChart } from "./MoMChangeChart";
import { MonthlySnapshotTable } from "./MonthlySnapshotTable";
import { AddMonthSheet } from "./AddMonthSheet";
import { FreedomCard } from "./FreedomCard";
import type {
  DashboardSummary,
  NetWorthChartPoint,
  MoMChangePoint,
  MonthData,
  Account,
} from "@/types";

interface DashboardShellProps {
  summary: DashboardSummary;
  chartData: NetWorthChartPoint[];
  momChanges: MoMChangePoint[];
  months: MonthData[];
  accounts: Account[];
}

export function DashboardShell({
  summary,
  chartData,
  momChanges,
  months,
  accounts,
}: DashboardShellProps) {
  const [selectedMonth, setSelectedMonth] = useState(summary.latestMonth);

  return (
    <div className="space-y-8">
      <SummaryCards summary={summary} chartData={chartData} />

      <NetWorthChart data={chartData} onSelectMonth={setSelectedMonth} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AssetAllocationChart data={chartData} />
        <MoMChangeChart data={momChanges} />
      </div>

      <FreedomCard current={summary.current} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Monthly snapshots
          </p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            Click a month to inspect account-level balances
          </p>
        </div>
        <AddMonthSheet
          accounts={accounts}
          latestMonthData={months[months.length - 1]}
        />
      </div>

      <MonthlySnapshotTable
        months={months}
        accounts={accounts}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />
    </div>
  );
}
