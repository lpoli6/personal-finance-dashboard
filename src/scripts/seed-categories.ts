import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Category hierarchy: parent → children
const CATEGORIES: {
  name: string;
  type: "income" | "expense" | "transfer";
  children?: string[];
}[] = [
  { name: "Groceries", type: "expense" },
  { name: "Dining Out", type: "expense" },
  { name: "Transport", type: "expense", children: ["Fuel", "Parking", "TfL", "Train", "Rideshare"] },
  { name: "Housing", type: "expense", children: ["Mortgage", "Bills", "Council Tax", "Home"] },
  { name: "Shopping", type: "expense", children: ["Clothing", "Electronics", "General"] },
  { name: "Health", type: "expense", children: ["Pharmacy", "Medical", "Fitness"] },
  { name: "Entertainment", type: "expense", children: ["Restaurants", "Drinks", "Events", "Streaming"] },
  { name: "Travel", type: "expense", children: ["Flights", "Hotels", "Activities"] },
  { name: "Subscriptions", type: "expense" },
  { name: "Personal Care", type: "expense" },
  { name: "Gifts", type: "expense" },
  { name: "Education", type: "expense" },
  { name: "Charity", type: "expense" },
  { name: "Transfers", type: "transfer", children: ["Internal Transfer", "Credit Card Payment"] },
  { name: "Income", type: "income", children: ["Salary", "Interest", "Refund"] },
  { name: "Fees & Charges", type: "expense" },
];

// Common category rules for auto-categorisation
const RULES: { pattern: string; categoryPath: string; priority: number }[] = [
  // Groceries
  { pattern: "SAINSBURY", categoryPath: "Groceries", priority: 10 },
  { pattern: "TESCO", categoryPath: "Groceries", priority: 10 },
  { pattern: "CO-OP", categoryPath: "Groceries", priority: 10 },
  { pattern: "WAITROSE", categoryPath: "Groceries", priority: 10 },
  { pattern: "ALDI", categoryPath: "Groceries", priority: 10 },
  { pattern: "M&S SIMPLY FOOD", categoryPath: "Groceries", priority: 10 },
  // Dining
  { pattern: "DELIVEROO", categoryPath: "Dining Out", priority: 10 },
  { pattern: "UBER EATS", categoryPath: "Dining Out", priority: 10 },
  { pattern: "PRET A MANGER", categoryPath: "Dining Out", priority: 8 },
  { pattern: "VACHERIN", categoryPath: "Dining Out", priority: 10 },
  // Transport
  { pattern: "TFL", categoryPath: "TfL", priority: 10 },
  { pattern: "BOLT", categoryPath: "Rideshare", priority: 8 },
  { pattern: "UBER", categoryPath: "Rideshare", priority: 5 },
  // Shopping
  { pattern: "AMAZON", categoryPath: "General", priority: 5 },
  { pattern: "RAPHA", categoryPath: "Clothing", priority: 10 },
  // Subscriptions/Streaming
  { pattern: "NETFLIX", categoryPath: "Streaming", priority: 10 },
  { pattern: "SPOTIFY", categoryPath: "Streaming", priority: 10 },
  { pattern: "PRIME VIDEO", categoryPath: "Streaming", priority: 10 },
  { pattern: "CLAUDE.AI", categoryPath: "Subscriptions", priority: 10 },
  { pattern: "GRANOLA INC", categoryPath: "Subscriptions", priority: 10 },
  { pattern: "GOOGLE*GOOGLE ONE", categoryPath: "Subscriptions", priority: 10 },
  { pattern: "CHATGPT", categoryPath: "Subscriptions", priority: 10 },
  // Transfers
  { pattern: "PAYMENT RECEIVED", categoryPath: "Credit Card Payment", priority: 10 },
  // Fitness
  { pattern: "SAUNASOCIALCLUB", categoryPath: "Fitness", priority: 10 },
  { pattern: "CLASSPASS", categoryPath: "Fitness", priority: 10 },
  // Gifts
  { pattern: "INTERFLORA", categoryPath: "Gifts", priority: 10 },
];

async function seed() {
  console.log("Seeding transaction categories...");

  // Clear existing
  await supabase.from("category_rules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("transaction_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const categoryIdMap = new Map<string, string>();

  // Insert parents first
  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from("transaction_categories")
      .insert({ name: cat.name, type: cat.type, parent_category_id: null })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to insert ${cat.name}:`, error.message);
      continue;
    }
    categoryIdMap.set(cat.name, data.id);

    // Insert children
    if (cat.children) {
      for (const child of cat.children) {
        const { data: childData, error: childErr } = await supabase
          .from("transaction_categories")
          .insert({ name: child, type: cat.type, parent_category_id: data.id })
          .select("id")
          .single();

        if (childErr) {
          console.error(`  Failed to insert ${child}:`, childErr.message);
        } else {
          categoryIdMap.set(child, childData.id);
        }
      }
    }
  }

  console.log(`  Inserted ${categoryIdMap.size} categories`);

  // Insert rules
  console.log("Seeding category rules...");
  let ruleCount = 0;
  for (const rule of RULES) {
    const categoryId = categoryIdMap.get(rule.categoryPath);
    if (!categoryId) {
      console.warn(`  Category not found for rule: ${rule.pattern} → ${rule.categoryPath}`);
      continue;
    }

    const { error } = await supabase.from("category_rules").insert({
      pattern: rule.pattern,
      category_id: categoryId,
      priority: rule.priority,
    });

    if (error) {
      console.error(`  Failed to insert rule ${rule.pattern}:`, error.message);
    } else {
      ruleCount++;
    }
  }

  console.log(`  Inserted ${ruleCount} rules`);

  // Verification
  console.log("\nVerification:");
  const { data: cats } = await supabase.from("transaction_categories").select("id");
  const { data: rules } = await supabase.from("category_rules").select("id");
  console.log(`  Categories: ${cats?.length || 0} (expected ~40)`);
  console.log(`  Rules: ${rules?.length || 0} (expected ~25)`);

  // Show hierarchy
  const { data: parents } = await supabase
    .from("transaction_categories")
    .select("name, type")
    .is("parent_category_id", null)
    .order("name");
  console.log("  Parent categories:");
  for (const p of parents || []) {
    console.log(`    ${p.name} (${p.type})`);
  }
}

seed().catch(console.error);
