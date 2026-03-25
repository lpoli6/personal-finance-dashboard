import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUDGET_ITEMS = [
  { name: "Monthly Take-Home", amount_pounds: 7000, type: "income", display_order: 1 },
  { name: "Subscriptions/Fixed Costs", amount_pounds: 831, type: "fixed", display_order: 2 },
  { name: "Joint Account", amount_pounds: 1000, type: "fixed", display_order: 3 },
  { name: "Mortgage", amount_pounds: 2500, type: "fixed", display_order: 4 },
  { name: "Vanguard Investment", amount_pounds: 500, type: "savings", display_order: 5 },
  { name: "Marcus Savings", amount_pounds: 500, type: "savings", display_order: 6 },
] as const;

async function seed() {
  console.log("Seeding budget items...");

  for (const item of BUDGET_ITEMS) {
    // Upsert by name
    await supabase.from("budget_items").delete().eq("name", item.name);

    const { error } = await supabase.from("budget_items").insert({
      name: item.name,
      amount_pence: item.amount_pounds * 100,
      type: item.type,
      display_order: item.display_order,
      is_active: true,
    });

    if (error) {
      console.error(`  Failed to insert ${item.name}:`, error.message);
    }
  }

  console.log("\nVerification:");
  const { data: items } = await supabase.from("budget_items").select("name, amount_pence, type");
  console.log(`  Budget items count: ${items?.length || 0} (expected 6)`);
  for (const item of items || []) {
    console.log(`    ${item.name}: £${(item.amount_pence / 100).toLocaleString()} (${item.type})`);
  }
}

seed().catch(console.error);
