"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SubscriptionSchema = z.object({
  name: z.string().min(1),
  amount_pence: z.number().int(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "annual"]),
  category: z.enum(["fitness", "entertainment", "improvement", "car", "miscellaneous"]),
  renewal_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createSubscription(data: z.infer<typeof SubscriptionSchema>) {
  const parsed = SubscriptionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").insert({ ...parsed.data, is_active: true });

  if (error) return { success: false, error: error.message };
  revalidatePath("/subscriptions");
  return { success: true };
}

export async function updateSubscription(id: string, data: Partial<z.infer<typeof SubscriptionSchema>>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/subscriptions");
  return { success: true };
}

export async function deactivateSubscription(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/subscriptions");
  return { success: true };
}
