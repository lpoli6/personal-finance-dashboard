"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createStatementRecord(
  sourceAccount: string,
  fileName: string,
  filePath: string,
  statementDate: string | null
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("statements")
    .insert({ source_account: sourceAccount, file_name: fileName, file_path: filePath, statement_date: statementDate })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message, statementId: null };
  return { success: true, statementId: data.id };
}

const ImportSchema = z.object({
  statementId: z.string().uuid(),
  sourceAccount: z.string(),
  transactions: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().min(1),
    originalDescription: z.string().nullable(),
    amountPence: z.number().int().positive(),
    direction: z.enum(["debit", "credit"]),
    categoryId: z.string().uuid().nullable(),
  })).min(1),
});

export async function importTransactions(input: z.infer<typeof ImportSchema>) {
  const parsed = ImportSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const supabase = await createClient();

  const rows = parsed.data.transactions.map((t) => ({
    date: t.date,
    description: t.description,
    original_description: t.originalDescription,
    amount_pence: t.amountPence,
    direction: t.direction,
    category_id: t.categoryId,
    source_account: parsed.data.sourceAccount,
    statement_id: parsed.data.statementId,
    reconciliation_status: "unreconciled" as const,
  }));

  const { error: insertErr } = await supabase.from("transactions").insert(rows);
  if (insertErr) return { success: false, error: insertErr.message };

  // Update statement record
  const totalDebits = rows.filter((r) => r.direction === "debit").reduce((s, r) => s + r.amount_pence, 0);
  const totalCredits = rows.filter((r) => r.direction === "credit").reduce((s, r) => s + r.amount_pence, 0);

  await supabase.from("statements").update({
    status: "imported",
    transaction_count: rows.length,
    total_debits_pence: totalDebits,
    total_credits_pence: totalCredits,
    updated_at: new Date().toISOString(),
  }).eq("id", parsed.data.statementId);

  revalidatePath("/transactions");
  return { success: true, count: rows.length };
}

export async function updateTransactionCategory(transactionId: string, categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId, updated_at: new Date().toISOString() })
    .eq("id", transactionId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/transactions");
  return { success: true };
}

export async function createCategoryRule(pattern: string, categoryId: string, sourceAccount?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("category_rules").insert({
    pattern: pattern.toUpperCase(),
    category_id: categoryId,
    source_account: sourceAccount || null,
    priority: 10,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function excludeTransaction(transactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ is_excluded: true, updated_at: new Date().toISOString() })
    .eq("id", transactionId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/transactions");
  return { success: true };
}

export async function matchTransactions(transactionId: string, matchedId: string) {
  const supabase = await createClient();
  const { error: e1 } = await supabase.from("transactions").update({
    reconciliation_status: "matched",
    matched_transaction_id: matchedId,
  }).eq("id", transactionId);
  const { error: e2 } = await supabase.from("transactions").update({
    reconciliation_status: "matched",
    matched_transaction_id: transactionId,
  }).eq("id", matchedId);

  if (e1 || e2) return { success: false, error: (e1 || e2)!.message };
  revalidatePath("/transactions");
  return { success: true };
}

export async function deleteStatement(statementId: string) {
  const supabase = await createClient();

  // Get statement for file path
  const { data: stmt } = await supabase.from("statements").select("file_path").eq("id", statementId).single();

  // Delete transactions
  await supabase.from("transactions").delete().eq("statement_id", statementId);

  // Delete statement
  await supabase.from("statements").delete().eq("id", statementId);

  // Delete file from storage
  if (stmt?.file_path) {
    await supabase.storage.from("statements").remove([stmt.file_path]);
  }

  revalidatePath("/transactions");
  return { success: true };
}
