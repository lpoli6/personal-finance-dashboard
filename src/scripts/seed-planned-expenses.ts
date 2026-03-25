import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const XLSX_PATH = path.resolve(__dirname, "../../Net Worth Tracker.xlsx");

async function seed() {
  console.log("Reading Budget Planning 2627 sheet from xlsx...");
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Budget Planning 2627"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

  // Row 0: header [Category, Amount, Type, Priority, Timing, Notes, ...]
  // Rows 1-10: planned expenses
  // Row 11: Total — skip

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0];
    const amount = row[1];
    const expenseType = row[2];
    const priority = row[3];
    const timing = row[4];
    const notes = row[5];

    // Skip total or empty rows
    if (!name || name === "Total" || typeof amount !== "number") continue;

    const amountPence = Math.round(amount * 100);
    const targetYear = timing != null ? String(timing) : null;

    // Upsert by name
    await supabase.from("planned_expenses").delete().eq("name", name);

    const { error } = await supabase.from("planned_expenses").insert({
      name,
      amount_pence: amountPence,
      expense_type: expenseType || "Expense",
      priority: priority || "Medium",
      target_year: targetYear,
      notes: typeof notes === "string" ? notes : null,
      is_completed: false,
    });

    if (error) {
      console.error(`  Failed to insert ${name}:`, error.message);
    } else {
      count++;
    }
  }

  console.log("\nVerification:");
  console.log(`  Planned expenses inserted: ${count} (expected 10)`);

  const { data: expenses } = await supabase
    .from("planned_expenses")
    .select("name, amount_pence, expense_type, priority, target_year")
    .order("amount_pence", { ascending: false });

  const totalPence = (expenses || []).reduce((sum, e) => sum + e.amount_pence, 0);
  console.log(`  Total planned: £${(totalPence / 100).toLocaleString()} (expected £137,000)`);
  for (const e of expenses || []) {
    console.log(`    ${e.name}: £${(e.amount_pence / 100).toLocaleString()} (${e.expense_type}, ${e.priority}, ${e.target_year})`);
  }
}

seed().catch(console.error);
