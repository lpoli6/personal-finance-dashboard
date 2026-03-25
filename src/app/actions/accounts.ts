"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AccountSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["cash", "isa", "pension", "investment", "property"]),
  side: z.enum(["asset", "liability"]),
  parent_account_id: z.string().uuid().nullable().optional(),
  display_order: z.number().int().default(0),
  notes: z.string().nullable().optional(),
});

export async function createAccount(data: z.infer<typeof AccountSchema>) {
  const parsed = AccountSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert(parsed.data);

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  return { success: true };
}

export async function updateAccount(id: string, data: Partial<z.infer<typeof AccountSchema>>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  return { success: true };
}

export async function deactivateAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function reorderAccount(id: string, newOrder: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ display_order: newOrder, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  return { success: true };
}

const PropertySchema = z.object({
  account_id: z.string().uuid(),
  purchase_date: z.string().nullable().optional(),
  purchase_price_pence: z.number().int().nullable().optional(),
  current_valuation_pence: z.number().int().nullable().optional(),
  valuation_date: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function upsertProperty(id: string | null, data: z.infer<typeof PropertySchema>) {
  const parsed = PropertySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("properties")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("properties").insert(parsed.data);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  return { success: true };
}

const MortgageSchema = z.object({
  account_id: z.string().uuid(),
  property_id: z.string().uuid(),
  original_amount_pence: z.number().int(),
  interest_rate: z.number().nullable().optional(),
  term_months: z.number().int().nullable().optional(),
  start_date: z.string().nullable().optional(),
  fixed_until: z.string().nullable().optional(),
  monthly_payment_pence: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function upsertMortgage(id: string | null, data: z.infer<typeof MortgageSchema>) {
  const parsed = MortgageSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("mortgages")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("mortgages").insert(parsed.data);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  return { success: true };
}
