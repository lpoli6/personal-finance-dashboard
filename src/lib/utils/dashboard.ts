import { format, subMonths, parseISO } from "date-fns";
import type {
  SnapshotWithAccount,
  MonthData,
  CategoryTotals,
  NetWorthChartPoint,
  MoMChangePoint,
  DashboardSummary,
  Account,
} from "@/types";

export function transformSnapshots(rows: SnapshotWithAccount[]): MonthData[] {
  const monthMap = new Map<string, SnapshotWithAccount[]>();

  for (const row of rows) {
    const existing = monthMap.get(row.month) || [];
    existing.push(row);
    monthMap.set(row.month, existing);
  }

  const months: MonthData[] = [];

  for (const [month, snapshots] of monthMap) {
    const accounts: Record<string, number> = {};
    let totalAssets = 0;
    let totalLiabilities = 0;
    let cashTotal = 0;
    let isaTotal = 0;
    let pensionTotal = 0;
    let investmentTotal = 0;
    let propertyTotal = 0;

    for (const s of snapshots) {
      accounts[s.account_id] = s.balance_pence;
      const { category, side } = s.accounts;

      if (side === "asset") {
        totalAssets += s.balance_pence;
        switch (category) {
          case "cash": cashTotal += s.balance_pence; break;
          case "isa": isaTotal += s.balance_pence; break;
          case "pension": pensionTotal += s.balance_pence; break;
          case "investment": investmentTotal += s.balance_pence; break;
          case "property": propertyTotal += s.balance_pence; break;
        }
      } else {
        totalLiabilities += s.balance_pence;
      }
    }

    months.push({
      month,
      accounts,
      computed: {
        netWorth: totalAssets - totalLiabilities,
        totalAssets,
        totalLiabilities,
        cashTotal,
        isaTotal,
        pensionTotal,
        investmentTotal,
        propertyTotal,
      },
    });
  }

  return months.sort((a, b) => a.month.localeCompare(b.month));
}

export function toChartData(months: MonthData[]): NetWorthChartPoint[] {
  return months.map((m) => ({
    month: format(parseISO(m.month), "MMM yyyy"),
    monthISO: m.month,
    netWorth: m.computed.netWorth,
    totalAssets: m.computed.totalAssets,
    totalLiabilities: m.computed.totalLiabilities,
    cash: m.computed.cashTotal,
    isa: m.computed.isaTotal,
    pension: m.computed.pensionTotal,
    investment: m.computed.investmentTotal,
    property: m.computed.propertyTotal,
  }));
}

export function toMoMChanges(months: MonthData[]): MoMChangePoint[] {
  return months.slice(1).map((m, i) => ({
    month: format(parseISO(m.month), "MMM yyyy"),
    monthISO: m.month,
    change: m.computed.netWorth - months[i].computed.netWorth,
  }));
}

export function computeSummary(months: MonthData[]): DashboardSummary {
  const latest = months[months.length - 1];
  const prev = months[months.length - 2];

  const latestDate = parseISO(latest.month);
  const yoyDate = subMonths(latestDate, 12);
  const yoyMonth = months.find(
    (m) => m.month === format(yoyDate, "yyyy-MM-dd")
  );

  const momChange = prev ? latest.computed.netWorth - prev.computed.netWorth : 0;
  const momPct = prev && prev.computed.netWorth !== 0
    ? (momChange / prev.computed.netWorth) * 100
    : 0;

  const yoyChange = yoyMonth
    ? latest.computed.netWorth - yoyMonth.computed.netWorth
    : 0;
  const yoyPct = yoyMonth && yoyMonth.computed.netWorth !== 0
    ? (yoyChange / yoyMonth.computed.netWorth) * 100
    : 0;

  return {
    current: latest.computed,
    momChange,
    momPct,
    yoyChange,
    yoyPct,
    latestMonth: latest.month,
  };
}

export function getLeafAccounts(rows: SnapshotWithAccount[]): Account[] {
  const seen = new Map<string, Account>();
  for (const row of rows) {
    if (!seen.has(row.accounts.id)) {
      seen.set(row.accounts.id, row.accounts);
    }
  }
  return Array.from(seen.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.display_order - b.display_order;
  });
}
