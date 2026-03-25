import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountsShell } from "@/components/accounts/AccountsShell";
import type { Account, AccountWithBalance, Property, Mortgage } from "@/types";

export default async function AccountsPage() {
  const supabase = await createClient();

  // Fetch all accounts
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .select("*")
    .order("category")
    .order("display_order");

  if (accErr) {
    return (
      <>
        <PageHeader title="Accounts" description="Manage your accounts and view balances" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load accounts: {accErr.message}
        </div>
      </>
    );
  }

  // Get latest month
  const { data: latestMonth } = await supabase
    .from("monthly_snapshots")
    .select("month")
    .order("month", { ascending: false })
    .limit(1)
    .single();

  // Get latest balances for all accounts
  let balanceMap: Record<string, number> = {};
  if (latestMonth) {
    const { data: snapshots } = await supabase
      .from("monthly_snapshots")
      .select("account_id, balance_pence")
      .eq("month", latestMonth.month);

    if (snapshots) {
      for (const s of snapshots) {
        balanceMap[s.account_id] = s.balance_pence;
      }
    }
  }

  const accountsWithBalance: AccountWithBalance[] = (accounts as Account[]).map((a) => ({
    ...a,
    latestBalancePence: balanceMap[a.id] ?? null,
  }));

  // Fetch properties and mortgages
  const { data: properties } = await supabase.from("properties").select("*");
  const { data: mortgages } = await supabase.from("mortgages").select("*");

  return (
    <>
      <PageHeader title="Accounts" description="Manage your accounts and view balances" />
      <AccountsShell
        accounts={accountsWithBalance}
        properties={(properties || []) as Property[]}
        mortgages={(mortgages || []) as Mortgage[]}
        latestMonth={latestMonth?.month || null}
      />
    </>
  );
}
