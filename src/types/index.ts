export type AccountCategory = "cash" | "isa" | "pension" | "investment" | "property";
export type AccountSide = "asset" | "liability";

export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
  side: AccountSide;
  parent_account_id: string | null;
  display_order: number;
  is_active: boolean;
  notes: string | null;
}

export interface MonthlySnapshot {
  id: string;
  account_id: string;
  month: string;
  balance_pence: number;
}

export interface SnapshotWithAccount extends MonthlySnapshot {
  accounts: Account;
}

export interface CategoryTotals {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashTotal: number;
  isaTotal: number;
  pensionTotal: number;
  investmentTotal: number;
  propertyTotal: number;
}

export interface MonthData {
  month: string;
  accounts: Record<string, number>;
  computed: CategoryTotals;
}

export interface NetWorthChartPoint {
  month: string;
  monthISO: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cash: number;
  isa: number;
  pension: number;
  investment: number;
  property: number;
}

export interface MoMChangePoint {
  month: string;
  monthISO: string;
  change: number;
}

export interface DashboardSummary {
  current: CategoryTotals;
  momChange: number;
  momPct: number;
  yoyChange: number;
  yoyPct: number;
  latestMonth: string;
}

export interface Property {
  id: string;
  account_id: string;
  purchase_date: string | null;
  purchase_price_pence: number | null;
  current_valuation_pence: number | null;
  valuation_date: string | null;
  address: string | null;
  notes: string | null;
}

export interface Mortgage {
  id: string;
  account_id: string;
  property_id: string;
  original_amount_pence: number;
  interest_rate: number | null;
  term_months: number | null;
  start_date: string | null;
  fixed_until: string | null;
  monthly_payment_pence: number | null;
  notes: string | null;
}

export interface AccountWithBalance extends Account {
  latestBalancePence: number | null;
}

export interface EditableSnapshotRow {
  accountId: string;
  accountName: string;
  category: AccountCategory;
  side: AccountSide;
  balancePence: number;
  displayOrder: number;
}
