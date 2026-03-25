import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubscriptionsShell } from "@/components/subscriptions/SubscriptionsShell";
import type { Subscription } from "@/types";

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("amount_pence", { ascending: false });

  if (error) {
    return (
      <>
        <PageHeader title="Subscriptions" description="Track recurring costs and renewal dates" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load: {error.message}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Subscriptions" description="Track recurring costs and renewal dates" />
      <SubscriptionsShell subscriptions={(data || []) as Subscription[]} />
    </>
  );
}
