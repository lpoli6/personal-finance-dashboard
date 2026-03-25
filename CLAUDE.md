# CLAUDE.md — Personal Finance Dashboard

## Project Overview

Single-user personal finance dashboard. Next.js 14+ (App Router), Supabase (Postgres), Vercel deployment. GBP (£) throughout.

**Repo:** `https://github.com/lpoli6/personal-finance-dashboard`

## Supabase Configuration

- **Project URL:** `https://dnrdwopcqpeafbfeedtp.supabase.co`
- **Anon/Publishable Key:** `sb_publishable_Z8QGMOLbuO36WUMqrLO6mA_Qo8dtsJL`
- **Direct DB Connection:** `postgresql://postgres:[YOUR-PASSWORD]@db.dnrdwopcqpeafbfeedtp.supabase.co:5432/postgres`

Environment variables (in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://dnrdwopcqpeafbfeedtp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Z8QGMOLbuO36WUMqrLO6mA_Qo8dtsJL
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.dnrdwopcqpeafbfeedtp.supabase.co:5432/postgres
ANTHROPIC_API_KEY=<set separately for LLM categorisation>
```

**IMPORTANT:** Replace `[YOUR-PASSWORD]` with the actual Supabase DB password. Never commit `.env.local`.

## Tech Stack

- **Framework:** Next.js 14+ App Router, TypeScript strict mode
- **Database:** Supabase (Postgres + `@supabase/supabase-js` + `@supabase/ssr`)
- **UI:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **XLSX Parsing:** SheetJS (xlsx package) — for importing data from the source spreadsheet
- **Dates:** date-fns
- **Validation:** Zod
- **Deploy:** Vercel

## Source Data

The source spreadsheet (`Net_Worth_Tracker.xlsx`) contains 8 sheets:

1. **Overview** — Monthly net worth snapshots (Feb 2023 → Feb 2026). Wide format: months as columns, accounts as rows. Includes assets (Cash, ISA, Pension, GIA, Property) and liabilities (Mortgage). This is the core dataset to import.

2. **Home Equity** — Full mortgage amortisation schedule. Monthly payment £2,477.27, interest rate 5.51%, original mortgage £403,000, property value £449,000 (purchased Dec 2023).

3. **Budget** — Monthly budget: £7,000 take-home, £5,331 committed (fixed costs/subscriptions £831, joint account £1,000, mortgage £2,500, Vanguard £500, Marcus £500), £1,669 discretionary.

4. **Subscriptions** — 26 active subscriptions totalling £831/month (£5,234/year). Categories: Fitness, Entertainment, Improvement, Car, Miscellaneous. Includes renewal dates.

5. **Future Planning** — Projection models for ISA/GIA/Pension at 6%/8%/10% returns over 5/10/15/20 year horizons. Palantir stock vesting schedule with tax calculations.

6. **CBRE** — Compensation data: UK package £419k (£240k base, £144k bonus, £35k equity). Salary sacrifice rates.

7. **Budget Planning 2627** — Major planned expenses 2025-27 totalling £137k from £150k budget. Includes wedding (£50k), family gifts, tax reserve, ISA contributions.

8. **Wedding Budget** — Empty (future use).

## Key Architecture Decisions

1. **Money in pence.** All monetary values stored as BIGINT in pence (£68,929 → 6892900). Display formatting only in the UI layer via `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.

2. **No stored totals.** Category totals (Cash, ISA, Pension, etc.), Total Assets, Total Liabilities, and Net Worth are **computed at query/display time** by summing leaf-level accounts. Never stored in the DB.

3. **Long format snapshots.** The original spreadsheet had months as columns. The DB stores one row per account per month in `monthly_snapshots`. Months are `DATE` type, always 1st of the month (e.g., `2025-03-01`).

4. **Account hierarchy.** Flat table with `parent_account_id` self-reference and `category` enum. Only leaf accounts have snapshots.

5. **Transaction categorisation is two-tier:** keyword/regex rules first (free, fast), Anthropic API fallback for unknowns using `claude-sonnet-4-20250514`.

6. **Single-user app.** No auth needed initially — this is a personal tool. Can add Supabase auth later if needed.

## Development Approach

**Work through phases in README.md sequentially.** Complete one phase fully before starting the next. Each phase has acceptance criteria — verify all pass before moving on.

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard
│   ├── accounts/page.tsx
│   ├── transactions/page.tsx
│   ├── subscriptions/page.tsx
│   ├── projections/page.tsx
│   ├── budget/page.tsx
│   └── api/categorise/route.ts     # LLM categorisation endpoint
├── components/
│   ├── layout/                     # Sidebar, Header
│   ├── dashboard/                  # NetWorthChart, SummaryCard, AssetAllocationChart, MonthlyTable
│   ├── transactions/               # ImportWizard, TransactionList, SpendingCharts
│   ├── projections/                # PensionModeller
│   ├── subscriptions/              # SubscriptionList, BurnCard
│   ├── budget/                     # BudgetOverview, BudgetPlanning
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── csv-parsers.ts
│   └── constants/
│       └── bank-formats.ts
├── types/index.ts
└── scripts/
    ├── seed-overview.ts
    └── seed-subscriptions.ts
```

## Conventions

- Server Components for data fetching, Client Components only where interactivity needed
- Server Actions for mutations
- Zod schemas for all form validation
- Error boundaries on all pages
- Loading skeletons for data-fetching states
- Toast notifications for mutations
- Responsive: desktop-first, functional on mobile