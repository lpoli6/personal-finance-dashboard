# Personal Finance Dashboard

A personal net worth tracker, spending analyser, budget planner, and pension modeller built with Next.js, Supabase, and Vercel.

---

## Development Phases

Work through each phase sequentially. Complete all acceptance criteria before moving to the next phase.

---

### Phase 0: Project Scaffolding & Database Schema

**Goal:** Initialise the project and create the database schema in Supabase.

#### 0.1 — Initialise Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

Install dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr recharts papaparse date-fns zod xlsx
npm install -D @types/papaparse
```

Install shadcn/ui via CLI, then add components: Button, Card, Table, Dialog, Select, Input, Tabs, Sheet, Badge, Tooltip, Separator, DropdownMenu, Skeleton, Sonner (toast).

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://dnrdwopcqpeafbfeedtp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Z8QGMOLbuO36WUMqrLO6mA_Qo8dtsJL
```

Set up Supabase client helpers in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

#### 0.2 — Database Schema

Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- ENUM types
CREATE TYPE account_category AS ENUM ('cash', 'isa', 'pension', 'investment', 'property');
CREATE TYPE account_side AS ENUM ('asset', 'liability');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE frequency_type AS ENUM ('weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE subscription_category AS ENUM ('fitness', 'entertainment', 'improvement', 'car', 'miscellaneous');
CREATE TYPE budget_item_type AS ENUM ('income', 'fixed', 'savings', 'discretionary');

-- 1. ACCOUNTS
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category account_category NOT NULL,
  side account_side NOT NULL DEFAULT 'asset',
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MONTHLY SNAPSHOTS
CREATE TABLE monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  balance_pence BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, month)
);

-- 3. PROPERTIES
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  purchase_date DATE,
  purchase_price_pence BIGINT,
  current_valuation_pence BIGINT,
  valuation_date DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. MORTGAGES
CREATE TABLE mortgages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  original_amount_pence BIGINT NOT NULL,
  interest_rate DECIMAL(5,3),
  term_months INT,
  start_date DATE,
  fixed_until DATE,
  monthly_payment_pence BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TRANSACTION CATEGORIES
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL DEFAULT 'expense',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  original_description TEXT,
  amount_pence BIGINT NOT NULL,
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  source_account TEXT,
  is_subscription BOOLEAN NOT NULL DEFAULT false,
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount_pence BIGINT NOT NULL,
  frequency frequency_type NOT NULL DEFAULT 'monthly',
  category subscription_category NOT NULL DEFAULT 'miscellaneous',
  renewal_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. BUDGET ITEMS
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount_pence BIGINT NOT NULL,
  type budget_item_type NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. PLANNED EXPENSES (major upcoming expenses like wedding, trips, etc.)
CREATE TABLE planned_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount_pence BIGINT NOT NULL,
  expense_type TEXT NOT NULL, -- 'Expense', 'Gift', 'Reserve', 'Investment'
  priority TEXT NOT NULL, -- 'Essential', 'High', 'Medium'
  target_year TEXT, -- '2025', '2025-26', '2027'
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. PENSION SCENARIOS
CREATE TABLE pension_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  monthly_contribution_pence BIGINT NOT NULL,
  employer_contribution_pence BIGINT DEFAULT 0,
  annual_return_pct DECIMAL(5,2) NOT NULL,
  retirement_age INT NOT NULL DEFAULT 57,
  inflation_rate_pct DECIMAL(5,2) DEFAULT 2.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. CATEGORY RULES (auto-categorisation)
CREATE TABLE category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE CASCADE,
  source_account TEXT,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_snapshots_month ON monthly_snapshots(month);
CREATE INDEX idx_snapshots_account ON monthly_snapshots(account_id);
CREATE INDEX idx_snapshots_account_month ON monthly_snapshots(account_id, month);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_source ON transactions(source_account);
CREATE INDEX idx_category_rules_pattern ON category_rules(pattern);

-- Disable RLS for now (single-user app)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pension_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (single user, allow all via anon key)
CREATE POLICY "Allow all" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON monthly_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON mortgages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transaction_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON planned_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pension_scenarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON category_rules FOR ALL USING (true) WITH CHECK (true);
```

#### Acceptance Criteria
- [ ] Next.js app runs locally (`npm run dev`)
- [ ] Supabase client connects successfully
- [ ] All tables created in Supabase
- [ ] `.env.local` configured and `.gitignore` includes it

---

### Phase 1: Core Layout & Navigation

**Goal:** App shell with sidebar navigation, responsive layout, dark/light mode.

**Pages:**
- `/` → Dashboard (net worth overview)
- `/accounts` → Account management
- `/transactions` → Transaction analysis
- `/subscriptions` → Subscription tracker
- `/budget` → Budget overview & planning
- `/projections` → Pension & investment modelling

**Components:**
- `Sidebar` with nav links, active state, icons (use lucide-react)
- `Header` with page title
- Dark/light mode toggle (persist preference)
- Responsive: sidebar collapses to bottom nav on mobile

**Acceptance Criteria:**
- [ ] All 6 pages render with placeholder content
- [ ] Sidebar navigation works with active highlighting
- [ ] Dark/light mode toggle works
- [ ] Mobile-responsive

---

### Phase 2: Net Worth Dashboard

**Goal:** Display net worth progression and allow monthly data entry.

**Components:**
1. **SummaryCard** — Current net worth, MoM change (£ and %), YoY change
2. **NetWorthChart** — Line chart over time, hoverable tooltips
3. **AssetAllocationChart** — Stacked area or donut showing Cash/ISA/Pension/Investment/Property composition
4. **MoMChangeChart** — Bar chart of monthly changes (green/red)
5. **MonthlyTable** — Editable table for a selected month showing all accounts
6. **AddMonthForm** — Pre-populated with last month's values. Spreadsheet-like speed: editable table, tab between cells, save all at once.

**Data flow:**
- Fetch `monthly_snapshots` joined with `accounts`
- Group by month, compute category totals + net worth
- MoM/YoY deltas computed client-side

**Acceptance Criteria:**
- [ ] Charts render (empty until Phase 4 seed)
- [ ] Summary card shows current net worth + deltas
- [ ] Monthly table editable with save
- [ ] "Add Month" pre-populates from previous month
- [ ] All values formatted as GBP

---

### Phase 3: Account Management

**Goal:** CRUD for accounts.

- List accounts grouped by category
- Add/edit/deactivate accounts
- Property + mortgage metadata forms

**Acceptance Criteria:**
- [ ] Can add a new account
- [ ] Can deactivate (historical data preserved)
- [ ] Property/mortgage details editable

---

### Phase 4: Historical Data Import (Seed)

**Goal:** Import all data from the xlsx into Supabase.

**Build scripts in `src/scripts/`:**

#### 4.1 — `seed-overview.ts` (Net Worth Data)
Parse the Overview sheet. Account mapping:

| Spreadsheet Row | Account Name | Category | Side | Parent Group |
|---|---|---|---|---|
| Marcus (Cash Savings) | Marcus (Cash Savings) | cash | asset | Cash |
| First Direct (Regular Saver) | First Direct (Regular Saver) | cash | asset | Cash |
| LISA (AJ Bell) | LISA (AJ Bell) | isa | asset | ISA |
| Vanguard ISA | Vanguard ISA | isa | asset | ISA |
| Pension 1 (Fidelity, Palantir) | Pension 1 (Fidelity, Palantir) | pension | asset | Pension |
| Pension 2 (L&G, Deliveroo) | Pension 2 (L&G, Deliveroo) | pension | asset | Pension |
| Pension 3 (L&G, DueDil) | Pension 3 (L&G, DueDil) | pension | asset | Pension |
| Vested Palantir Stock | Vested Palantir Stock | investment | asset | GIA |
| GIA Account | GIA Account | investment | asset | GIA |
| Home Equity (absolute) | Home Equity | property | asset | — |
| Mortgage Remaining | Mortgage | property | liability | — |

Do NOT import aggregate rows (Cash total, ISA total, Total Assets, Net Worth, etc.). Use UPSERT.

#### 4.2 — `seed-subscriptions.ts` (Subscription Data)
Seed the 26 subscriptions from the Subscriptions sheet:

| Name | Monthly (£) | Category | Frequency |
|---|---|---|---|
| Social Sauna | 40.00 | fitness | monthly |
| Milo & the Bull | 100.00 | fitness | monthly |
| JOIN Cycling | 8.33 | fitness | annual |
| Runna | 8.33 | fitness | annual |
| Netflix | 18.99 | entertainment | monthly |
| Amazon Prime | 7.92 | entertainment | annual |
| Apple TV | 8.99 | entertainment | monthly |
| Spotify | 17.99 | entertainment | monthly |
| Granola | 14.00 | improvement | monthly |
| Todoist | 5.00 | improvement | annual |
| ChatGPT | 20.00 | improvement | monthly |
| Claude | 75.00 | improvement | monthly |
| Yousician | 10.00 | improvement | annual |
| Mounjaro | 270.00 | improvement | monthly |
| Starlink | 30.00 | miscellaneous | monthly |
| ClassPass (joint) | 29.79 | fitness | monthly |
| Strava | 4.58 | fitness | annual |
| Training Peaks | 9.25 | fitness | annual |
| iCloud+ | 8.99 | miscellaneous | monthly |
| Google One | 18.99 | miscellaneous | monthly |
| Car Insurance | 33.33 | car | annual |
| Road Tax | 16.67 | car | annual |
| Car MOT | 41.67 | car | annual |
| TV Licensing | 14.17 | miscellaneous | annual |
| O2 SIM | 18.88 | miscellaneous | monthly |

#### 4.3 — `seed-budget.ts` (Budget Data)
Seed budget items:

| Name | Amount (£) | Type |
|---|---|---|
| Monthly Take-Home | 7,000 | income |
| Subscriptions/Fixed Costs | 831 | fixed |
| Joint Account | 1,000 | fixed |
| Mortgage | 2,500 | fixed |
| Vanguard Investment | 500 | savings |
| Marcus Savings | 500 | savings |

#### 4.4 — `seed-planned-expenses.ts` (Budget Planning 26/27)
Seed planned expenses:

| Name | Amount (£) | Type | Priority | Timing |
|---|---|---|---|---|
| Wedding | 50,000 | Expense | Essential | 2027 |
| University (Sister) | 18,000 | Gift | Essential | 2025-26 |
| Engagement Party | 5,000 | Expense | Essential | 2025 |
| Civil Ceremony | 5,000 | Expense | Essential | 2025-26 |
| Victoria's 30th | 5,000 | Expense | High | 2025 |
| Trip with Mum & Sister | 10,000 | Expense | High | 2025-26 |
| Sister's 18th Trip | 3,000 | Expense | High | 2025 |
| Holiday with Victoria | 5,000 | Expense | Medium | 2025 |
| Tax Reserve | 20,000 | Reserve | Essential | 2025 |
| ISA Contribution | 16,000 | Investment | High | 2025-26 |

Also seed the property and mortgage records:
- Property: purchased Dec 2023, £449,000 valuation, deposit £49,000
- Mortgage: £403,000, 5.51% interest, £2,477.27/month payment

**Verification spot checks:**
- Feb 2023 net worth = £68,929
- Feb 2025 net worth = £209,839
- Feb 2026 net worth = £418,223
- Total subscriptions = ~£831/month

**Acceptance Criteria:**
- [ ] All historical snapshots imported
- [ ] Computed net worth matches spreadsheet at spot-check months
- [ ] Subscriptions, budget items, planned expenses seeded
- [ ] Property and mortgage records created
- [ ] Dashboard shows real data
- [ ] Re-running scripts doesn't duplicate

---

### Phase 5: Subscription & Budget Pages

**Goal:** Display subscription burn and budget overview.

**Subscriptions page (`/subscriptions`):**
- Active subscriptions list grouped by category
- Summary card: total monthly burn, total annual cost
- Category breakdown (donut or bar chart)
- Add/edit/deactivate subscriptions
- Renewal date tracking

**Budget page (`/budget`):**
- Monthly budget waterfall: income → committed → discretionary
- Budget items list (editable)
- Planned expenses table with status tracking (completed/pending)
- Total planned vs available budget summary

**Acceptance Criteria:**
- [ ] Subscriptions render from seeded data
- [ ] Total monthly/annual cost correct (~£831/month)
- [ ] Budget waterfall shows £7,000 → £5,331 committed → £1,669 discretionary
- [ ] Planned expenses table renders with priorities
- [ ] Can add/edit subscriptions and budget items

---

### Phase 6: Transaction Import & Categorisation

**Goal:** Upload bank statement CSVs, parse, categorise, analyse spending.

**Upload flow:**
1. Select bank format (Amex, First Direct, Monzo) + upload CSV
2. Parse and display for review with auto-suggested categories
3. Override categories, confirm import
4. Duplicate detection (same date + amount + description + source)

**Categorisation:**
1. Rules-based: match description against `category_rules` patterns
2. LLM fallback: `/api/categorise` endpoint → Anthropic API (`claude-sonnet-4-20250514`)
3. User override → offer to create new rule

**Views:**
- Monthly spending breakdown (donut by category)
- Spending over time (stacked bar)
- Transaction list with filters
- Top merchants

**Acceptance Criteria:**
- [ ] CSV upload and parsing works for 3+ bank formats
- [ ] Auto-categorisation works
- [ ] LLM fallback endpoint works
- [ ] Charts render
- [ ] Duplicate detection prevents re-imports

---

### Phase 7: Pension & Investment Projection Modelling

**Goal:** Interactive pension growth modelling + investment projections.

**Pension modeller:**
- Current value (from latest snapshot)
- Monthly contribution + employer match
- Return rate slider (4%/6%/8%/10% presets)
- Retirement age (default 57)
- Inflation rate (default 2.5%)
- Real-time chart + year-by-year table
- Save/compare multiple scenarios

**Investment projections:**
- Model GIA growth at different return rates
- Show 5/10/15/20 year horizons (matching Future Planning sheet)
- Combined net worth projection (ISA + GIA + Pension)

**Acceptance Criteria:**
- [ ] Pension modeller with real-time chart updates
- [ ] Save and compare scenarios
- [ ] Investment projection across time horizons
- [ ] Both nominal and inflation-adjusted values shown

---

## Data Entry Workflow (Monthly)

1. Dashboard → "Add Month" for previous month
2. Editable table pre-populated with last month's values
3. Update closing balances (tab between cells, spreadsheet speed)
4. Save → recalculates totals and MoM changes

---

## Useful Commands

```bash
npm run dev                    # Development server
npx tsx src/scripts/seed-overview.ts       # Import net worth history
npx tsx src/scripts/seed-subscriptions.ts  # Import subscriptions
npx tsx src/scripts/seed-budget.ts         # Import budget items
npx tsx src/scripts/seed-planned-expenses.ts # Import planned expenses
vercel                         # Deploy
```