"use client";

import { useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { NetWorthChart } from "./NetWorthChart";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { MoMChangeChart } from "./MoMChangeChart";
import { MonthlySnapshotTable } from "./MonthlySnapshotTable";
import { AddMonthSheet } from "./AddMonthSheet";
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
      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthChart data={chartData} onSelectMonth={setSelectedMonth} />
        <AssetAllocationChart data={chartData} />
      </div>

      <MoMChangeChart data={momChanges} />

      <div className="flex items-center justify-between">
        <div />
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
