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

export interface Subscription {
  id: string;
  name: string;
  amount_pence: number;
  frequency: "weekly" | "monthly" | "quarterly" | "annual";
  category: "fitness" | "entertainment" | "improvement" | "car" | "miscellaneous";
  renewal_date: string | null;
  is_active: boolean;
  notes: string | null;
}

export type SubscriptionCategory = Subscription["category"];

export interface BudgetItem {
  id: string;
  name: string;
  amount_pence: number;
  type: "income" | "fixed" | "savings" | "discretionary";
  display_order: number;
  is_active: boolean;
  notes: string | null;
}

export interface PlannedExpense {
  id: string;
  name: string;
  amount_pence: number;
  expense_type: string;
  priority: string;
  target_year: string | null;
  notes: string | null;
  is_completed: boolean;
}

// --- Transaction types ---

export type TransactionDirection = "debit" | "credit";
export type ReconciliationStatus = "unreconciled" | "matched" | "excluded";
export type StatementStatus = "pending" | "imported" | "reconciled";

export interface Statement {
  id: string;
  source_account: string;
  statement_date: string | null;
  file_path: string;
  file_name: string;
  status: StatementStatus;
  transaction_count: number;
  total_debits_pence: number;
  total_credits_pence: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  original_description: string | null;
  amount_pence: number;
  direction: TransactionDirection;
  category_id: string | null;
  source_account: string | null;
  statement_id: string | null;
  reconciliation_status: ReconciliationStatus;
  matched_transaction_id: string | null;
  is_subscription: boolean;
  is_excluded: boolean;
  notes: string | null;
}

export interface TransactionWithCategory extends Transaction {
  transaction_categories: TransactionCategory | null;
}

export interface TransactionCategory {
  id: string;
  name: string;
  parent_category_id: string | null;
  type: "income" | "expense" | "transfer";
  icon: string | null;
}

export interface CategoryRule {
  id: string;
  pattern: string;
  category_id: string;
  source_account: string | null;
  priority: number;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  originalDescription: string;
  amountPence: number;
  direction: TransactionDirection;
  categoryId: string | null;
  categoryName: string | null;
  confidence: number | null;
  foreignAmount: string | null;
  foreignCurrency: string | null;
  isDuplicate: boolean;
  duplicateOf: string | null;
  excluded: boolean;
}

export interface EditableSnapshotRow {
  accountId: string;
  accountName: string;
  category: AccountCategory;
  side: AccountSide;
  balancePence: number;
  displayOrder: number;
}

// --- Projection types ---

export interface PensionScenario {
  id: string;
  name: string;
  account_id: string;
  monthly_contribution_pence: number;
  employer_contribution_pence: number;
  annual_return_pct: number;
  retirement_age: number;
  inflation_rate_pct: number;
}

export interface ProjectionYear {
  year: number;
  age: number;
  nominalValue: number;
  realValue: number;
  cumulativeContributions: number;
  growth: number;
}
