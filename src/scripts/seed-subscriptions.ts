import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const XLSX_PATH = path.resolve(__dirname, "../../Net Worth Tracker.xlsx");

function excelDateToISO(serial: number): string | null {
  if (!serial || typeof serial !== "number") return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + serial * 86400000);
  return date.toISOString().split("T")[0];
}

const CATEGORY_MAP: Record<string, string> = {
  fitness: "fitness",
  entertainment: "entertainment",
  improvement: "improvement",
  car: "car",
  miscellaneous: "miscellaneous",
};

async function seed() {
  console.log("Reading Subscriptions sheet from xlsx...");
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Subscriptions"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

  // Row 0: headers [Name, Monthly Cost, Annual Cost, Category, Renewal Date]
  // Rows 1-26: subscriptions
  // Row 27: Total row — skip

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0];
    const monthlyCost = row[1];
    const category = row[3];
    const renewalRaw = row[4];

    // Skip total row or empty rows
    if (!name || name === "Total" || typeof monthlyCost !== "number") continue;

    const categoryKey = CATEGORY_MAP[category?.toLowerCase()] || "miscellaneous";
    const amountPence = Math.round(monthlyCost * 100);

    // Determine frequency from renewal column
    let frequency = "monthly";
    let renewalDate: string | null = null;

    if (typeof renewalRaw === "number") {
      // Excel serial date → annual subscription with renewal date
      frequency = "annual";
      renewalDate = excelDateToISO(renewalRaw);
    } else if (renewalRaw === "Annual") {
      frequency = "annual";
    }
    // "Monthly" or anything else → monthly, no renewal date

    // Upsert by name (delete existing, then insert)
    await supabase.from("subscriptions").delete().eq("name", name);

    const { error } = await supabase.from("subscriptions").insert({
      name,
      amount_pence: amountPence,
      frequency,
      category: categoryKey,
      renewal_date: renewalDate,
      is_active: true,
    });

    if (error) {
      console.error(`  Failed to insert ${name}:`, error.message);
    } else {
      count++;
    }
  }

  console.log(`\nVerification:`);
  console.log(`  Subscriptions inserted: ${count}`);

  // Total monthly cost check
  const { data: subs } = await supabase.from("subscriptions").select("amount_pence");
  const totalPence = (subs || []).reduce((sum, s) => sum + s.amount_pence, 0);
  console.log(`  Total monthly cost: £${(totalPence / 100).toFixed(2)} (expected ~£831)`);
  console.log(`  Count: ${subs?.length || 0} (expected 26)`);
}

seed().catch(console.error);
