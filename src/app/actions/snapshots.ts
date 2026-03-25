"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpsertSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  balances: z
    .array(
      z.object({
        accountId: z.string().uuid(),
        balancePence: z.number().int(),
      })
    )
    .min(1),
});

export async function upsertSnapshots(
  month: string,
  balances: { accountId: string; balancePence: number }[]
) {
  const parsed = UpsertSchema.safeParse({ month, balances });
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = await createClient();

  const rows = parsed.data.balances.map(({ accountId, balancePence }) => ({
    account_id: accountId,
    month: parsed.data.month,
    balance_pence: balancePence,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("monthly_snapshots")
    .upsert(rows, { onConflict: "account_id,month" });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
