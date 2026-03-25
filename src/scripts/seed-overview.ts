import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const XLSX_PATH = path.resolve(__dirname, "../../Net Worth Tracker.xlsx");

// Excel serial date → ISO date string (1st of month)
function excelDateToISO(serial: number): string | null {
  if (!serial || typeof serial !== "number") return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + serial * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

// Parent group definitions
const PARENT_GROUPS = [
  { name: "Cash", category: "cash", side: "asset" },
  { name: "ISA", category: "isa", side: "asset" },
  { name: "Pension", category: "pension", side: "asset" },
  { name: "GIA", category: "investment", side: "asset" },
] as const;

// Leaf account mapping: xlsx row name → account config
const LEAF_ACCOUNTS = [
  { xlsxName: "Marcus (Cash Savings)", name: "Marcus (Cash Savings)", category: "cash", side: "asset", parent: "Cash", order: 1 },
  { xlsxName: "First Direct (Regular Saver)", name: "First Direct (Regular Saver)", category: "cash", side: "asset", parent: "Cash", order: 2 },
  { xlsxName: "LISA (AJ Bell)", name: "LISA (AJ Bell)", category: "isa", side: "asset", parent: "ISA", order: 3 },
  { xlsxName: "Vanguard ISA", name: "Vanguard ISA", category: "isa", side: "asset", parent: "ISA", order: 4 },
  { xlsxName: "Pension 1 (Fidelity, Palantir)", name: "Pension 1 (Fidelity, Palantir)", category: "pension", side: "asset", parent: "Pension", order: 5 },
  { xlsxName: "Pension 2 (Legal & General, Deliveroo)", name: "Pension 2 (L&G, Deliveroo)", category: "pension", side: "asset", parent: "Pension", order: 6 },
  { xlsxName: "Pension 3 (Legal & General, DueDil)", name: "Pension 3 (L&G, DueDil)", category: "pension", side: "asset", parent: "Pension", order: 7 },
  { xlsxName: "Vested Palantir Stock", name: "Vested Palantir Stock", category: "investment", side: "asset", parent: "GIA", order: 8 },
  { xlsxName: "GIA Account", name: "GIA Account", category: "investment", side: "asset", parent: "GIA", order: 9 },
  { xlsxName: "Home Equity (absolute)", name: "Home Equity", category: "property", side: "asset", parent: null, order: 10 },
  { xlsxName: "Mortgage Remaining", name: "Mortgage", category: "property", side: "liability", parent: null, order: 11 },
] as const;

async function ensureAccount(
  name: string,
  category: string,
  side: string,
  displayOrder: number,
  parentAccountId: string | null
): Promise<string> {
  // Check if exists
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", name)
    .single();

  if (existing) {
    // Update to ensure correct metadata
    await supabase
      .from("accounts")
      .update({ category, side, display_order: displayOrder, parent_account_id: parentAccountId, is_active: true })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("accounts")
    .insert({ name, category, side, display_order: displayOrder, parent_account_id: parentAccountId, is_active: true })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create account ${name}: ${error?.message}`);
  }
  return inserted.id;
}

async function seed() {
  console.log("Reading Overview sheet from xlsx...");
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets["Overview"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

  // Row 1 (0-based) has month date serials starting col 2
  const dateRow = rows[1];
  const months: { colIndex: number; monthISO: string }[] = [];
  for (let c = 2; c < dateRow.length; c++) {
    const iso = excelDateToISO(dateRow[c]);
    if (iso) months.push({ colIndex: c, monthISO: iso });
  }
  console.log(`Found ${months.length} month columns: ${months[0]?.monthISO} → ${months[months.length - 1]?.monthISO}`);

  // Build name → row map
  const nameRowMap = new Map<string, any[]>();
  for (const row of rows) {
    const name = row[1];
    if (typeof name === "string" && name.trim()) {
      nameRowMap.set(name.trim(), row);
    }
  }

  // Step 1: Create parent accounts
  console.log("Creating parent accounts...");
  const parentIdMap = new Map<string, string>();
  for (const pg of PARENT_GROUPS) {
    const id = await ensureAccount(pg.name, pg.category, pg.side, 0, null);
    parentIdMap.set(pg.name, id);
  }

  // Step 2: Create leaf accounts
  console.log("Creating leaf accounts...");
  const accountIdMap = new Map<string, string>();
  for (const leaf of LEAF_ACCOUNTS) {
    const parentId = leaf.parent ? parentIdMap.get(leaf.parent) || null : null;
    const id = await ensureAccount(leaf.name, leaf.category, leaf.side, leaf.order, parentId);
    accountIdMap.set(leaf.name, id);
  }
  console.log(`Ensured ${accountIdMap.size} leaf accounts + ${parentIdMap.size} parent accounts`);

  // Get Mortgage Remaining row for computing full property value
  const mortgageRow = nameRowMap.get("Mortgage Remaining");
  const equityRow = nameRowMap.get("Home Equity (absolute)");

  // Step 3: Build snapshot rows
  console.log("Building snapshot rows...");
  const snapshotRows: { account_id: string; month: string; balance_pence: number }[] = [];

  for (const leaf of LEAF_ACCOUNTS) {
    const dataRow = nameRowMap.get(leaf.xlsxName);
    if (!dataRow) {
      console.warn(`  Row not found for: ${leaf.xlsxName}`);
      continue;
    }

    const accountId = accountIdMap.get(leaf.name)!;
    let firstNonZeroSeen = false;

    for (const { colIndex, monthISO } of months) {
      let valuePounds: number;

      if (leaf.xlsxName === "Home Equity (absolute)") {
        // Store FULL property value (equity + mortgage) so Net Worth = Assets - Liabilities works
        const equity = typeof equityRow?.[colIndex] === "number" ? equityRow[colIndex] : 0;
        const mortgage = typeof mortgageRow?.[colIndex] === "number" ? mortgageRow[colIndex] : 0;
        valuePounds = equity + mortgage;
      } else {
        valuePounds = typeof dataRow[colIndex] === "number" ? dataRow[colIndex] : 0;
      }

      const balancePence = Math.round(valuePounds * 100);

      // Track first non-zero: include all months from first non-zero onward
      if (balancePence !== 0) firstNonZeroSeen = true;
      if (!firstNonZeroSeen) continue;

      snapshotRows.push({ account_id: accountId, month: monthISO, balance_pence: balancePence });
    }
  }

  // Filter out months where ALL accounts are zero (future empty months)
  const monthTotals = new Map<string, number>();
  for (const row of snapshotRows) {
    monthTotals.set(row.month, (monthTotals.get(row.month) || 0) + Math.abs(row.balance_pence));
  }
  const filtered = snapshotRows.filter((r) => (monthTotals.get(r.month) || 0) > 0);

  // Step 4: Upsert snapshots
  console.log(`Upserting ${filtered.length} snapshots...`);
  const batchSize = 200;
  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize);
    const { error } = await supabase
      .from("monthly_snapshots")
      .upsert(batch, { onConflict: "account_id,month" });
    if (error) {
      console.error(`  Batch upsert failed at offset ${i}:`, error.message);
      process.exit(1);
    }
  }

  console.log("\nVerification:");
  console.log(`  Snapshot count: ${filtered.length}`);
  await spotCheck("2023-02-01", 6892900);
  await spotCheck("2025-02-01", 20983900);
  await spotCheck("2026-01-01", 41822300);
}

async function spotCheck(month: string, expectedPence: number) {
  const { data } = await supabase
    .from("monthly_snapshots")
    .select("balance_pence, accounts!inner(side)")
    .eq("month", month);

  let netWorth = 0;
  for (const row of (data || []) as any[]) {
    netWorth += row.accounts.side === "asset" ? row.balance_pence : -row.balance_pence;
  }
  const match = netWorth === expectedPence;
  console.log(
    `  ${month}: Net Worth = £${(netWorth / 100).toLocaleString()} (expected £${(expectedPence / 100).toLocaleString()}) ${match ? "✓" : "✗ MISMATCH"}`
  );
}

seed().catch(console.error);
