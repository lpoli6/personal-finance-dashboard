"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ScenarioSchema = z.object({
  name: z.string().min(1),
  account_id: z.string().uuid(),
  monthly_contribution_pence: z.number().int(),
  employer_contribution_pence: z.number().int().default(0),
  annual_return_pct: z.number(),
  retirement_age: z.number().int().min(50).max(68),
  inflation_rate_pct: z.number().default(2.5),
});

export async function saveScenario(data: z.infer<typeof ScenarioSchema>) {
  const parsed = ScenarioSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();
  const { error } = await supabase.from("pension_scenarios").insert(parsed.data);

  if (error) return { success: false, error: error.message };
  revalidatePath("/projections");
  return { success: true };
}

export async function deleteScenario(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pension_scenarios").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/projections");
  return { success: true };
}
