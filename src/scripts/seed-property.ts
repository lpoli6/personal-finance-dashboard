import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const XLSX_PATH = path.resolve(__dirname, "../../Net Worth Tracker.xlsx");

async function seed() {
  console.log("Reading data for property and mortgage records...");

  // Read Overview sheet to find first mortgage value
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Overview"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

  // Find Mortgage Remaining row
  let firstMortgageValue = 403000; // default
  for (const row of rows) {
    if (row[1] === "Mortgage Remaining") {
      for (let c = 2; c < row.length; c++) {
        if (typeof row[c] === "number" && row[c] > 0) {
          firstMortgageValue = row[c];
          break;
        }
      }
      break;
    }
  }
  console.log(`  First mortgage value from data: £${firstMortgageValue.toLocaleString()}`);

  // Get account IDs
  const { data: homeEquityAcc } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", "Home Equity")
    .single();

  const { data: mortgageAcc } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", "Mortgage")
    .single();

  if (!homeEquityAcc || !mortgageAcc) {
    console.error("Home Equity or Mortgage account not found. Run seed-overview.ts first.");
    process.exit(1);
  }

  // Upsert property record
  const { data: existingProp } = await supabase
    .from("properties")
    .select("id")
    .eq("account_id", homeEquityAcc.id)
    .single();

  const propertyData = {
    account_id: homeEquityAcc.id,
    purchase_date: "2023-12-01",
    purchase_price_pence: 44900000, // £449,000
    current_valuation_pence: 44900000, // £449,000
    valuation_date: "2023-12-01",
    address: null,
  };

  let propertyId: string;
  if (existingProp) {
    await supabase.from("properties").update(propertyData).eq("id", existingProp.id);
    propertyId = existingProp.id;
    console.log("  Updated existing property record");
  } else {
    const { data: newProp, error } = await supabase
      .from("properties")
      .insert(propertyData)
      .select("id")
      .single();
    if (error || !newProp) {
      console.error("Failed to create property:", error?.message);
      process.exit(1);
    }
    propertyId = newProp.id;
    console.log("  Created property record");
  }

  // Upsert mortgage record
  const firstMortgagePence = Math.round(firstMortgageValue * 100);

  const { data: existingMort } = await supabase
    .from("mortgages")
    .select("id")
    .eq("account_id", mortgageAcc.id)
    .single();

  const mortgageData = {
    account_id: mortgageAcc.id,
    property_id: propertyId,
    original_amount_pence: firstMortgagePence,
    interest_rate: 5.51,
    term_months: 300, // 25 years
    start_date: "2023-12-01",
    monthly_payment_pence: 247727, // £2,477.27
  };

  if (existingMort) {
    await supabase.from("mortgages").update(mortgageData).eq("id", existingMort.id);
    console.log("  Updated existing mortgage record");
  } else {
    const { error } = await supabase.from("mortgages").insert(mortgageData);
    if (error) {
      console.error("Failed to create mortgage:", error.message);
      process.exit(1);
    }
    console.log("  Created mortgage record");
  }

  console.log("\nVerification:");
  const { data: prop } = await supabase.from("properties").select("*").eq("id", propertyId).single();
  const { data: mort } = await supabase.from("mortgages").select("*").eq("property_id", propertyId).single();

  console.log(`  Property exists: ${!!prop} ✓`);
  console.log(`    Purchase price: £${((prop?.purchase_price_pence || 0) / 100).toLocaleString()}`);
  console.log(`    Valuation: £${((prop?.current_valuation_pence || 0) / 100).toLocaleString()}`);
  console.log(`  Mortgage exists: ${!!mort} ✓`);
  console.log(`    Original amount: £${((mort?.original_amount_pence || 0) / 100).toLocaleString()}`);
  console.log(`    Interest rate: ${mort?.interest_rate}%`);
  console.log(`    Monthly payment: £${((mort?.monthly_payment_pence || 0) / 100).toLocaleString()}`);
  console.log(`    Term: ${mort?.term_months} months (${(mort?.term_months || 0) / 12} years)`);
}

seed().catch(console.error);
