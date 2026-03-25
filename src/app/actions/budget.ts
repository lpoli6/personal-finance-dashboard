"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BudgetItemSchema = z.object({
  name: z.string().min(1),
  amount_pence: z.number().int(),
  type: z.enum(["income", "fixed", "savings", "discretionary"]),
  display_order: z.number().int().default(0),
  notes: z.string().nullable().optional(),
});

export async function createBudgetItem(data: z.infer<typeof BudgetItemSchema>) {
  const parsed = BudgetItemSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").insert({ ...parsed.data, is_active: true });

  if (error) return { success: false, error: error.message };
  revalidatePath("/budget");
  return { success: true };
}

export async function updateBudgetItem(id: string, data: Partial<z.infer<typeof BudgetItemSchema>>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_items")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/budget");
  return { success: true };
}

export async function togglePlannedExpenseComplete(id: string, isCompleted: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("planned_expenses")
    .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/budget");
  return { success: true };
}
