import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionsShell } from "@/components/transactions/TransactionsShell";
import type {
  TransactionWithCategory,
  TransactionCategory,
  CategoryRule,
  Statement,
} from "@/types";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [txRes, catRes, ruleRes, stmtRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, transaction_categories(id, name, parent_category_id, type)")
      .order("date", { ascending: false }),
    supabase.from("transaction_categories").select("*").order("name"),
    supabase.from("category_rules").select("*"),
    supabase
      .from("statements")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (txRes.error || catRes.error) {
    return (
      <>
        <PageHeader
          eyebrow="Money"
          title="Transactions"
          description="Import, categorise, and analyse spending."
        />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load: {txRes.error?.message || catRes.error?.message}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Import, categorise, and analyse spending"
      />
      <TransactionsShell
        transactions={(txRes.data || []) as TransactionWithCategory[]}
        categories={(catRes.data || []) as TransactionCategory[]}
        rules={(ruleRes.data || []) as CategoryRule[]}
        statements={(stmtRes.data || []) as Statement[]}
      />
    </>
  );
}
