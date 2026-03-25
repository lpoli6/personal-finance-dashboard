import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Leaf accounts to seed (skip aggregate rows)
const LEAF_ACCOUNTS: {
  csvRowName: string;
  name: string;
  category: string;
  side: string;
  displayOrder: number;
}[] = [
  { csvRowName: "Marcus (Cash Savings)", name: "Marcus (Cash Savings)", category: "cash", side: "asset", displayOrder: 1 },
  { csvRowName: "First Direct (Regular Saver)", name: "First Direct (Regular Saver)", category: "cash", side: "asset", displayOrder: 2 },
  { csvRowName: "LISA (AJ Bell)", name: "LISA (AJ Bell)", category: "isa", side: "asset", displayOrder: 3 },
  { csvRowName: "Vanguard ISA", name: "Vanguard ISA", category: "isa", side: "asset", displayOrder: 4 },
  { csvRowName: "Pension 1 (Fidelity, Palantir)", name: "Pension 1 (Fidelity, Palantir)", category: "pension", side: "asset", displayOrder: 5 },
  { csvRowName: "Pension 2 (Legal & General, Deliveroo)", name: "Pension 2 (L&G, Deliveroo)", category: "pension", side: "asset", displayOrder: 6 },
  { csvRowName: "Pension 3 (Legal & General, DueDil)", name: "Pension 3 (L&G, DueDil)", category: "pension", side: "asset", displayOrder: 7 },
  { csvRowName: "Vested Palantir Stock", name: "Vested Palantir Stock", category: "investment", side: "asset", displayOrder: 8 },
  { csvRowName: "GIA Account", name: "GIA Account", category: "investment", side: "asset", displayOrder: 9 },
  { csvRowName: "Home Equity (absolute)", name: "Home Equity", category: "property", side: "asset", displayOrder: 10 },
  { csvRowName: "Mortgage Remaining", name: "Mortgage", category: "property", side: "liability", displayOrder: 11 },
];

function parsePounds(str: string): number {
  if (!str || str.trim() === "" || str.trim() === "-") return 0;
  const cleaned = str.replace(/[£,\s]/g, "");
  const pounds = parseFloat(cleaned);
  if (isNaN(pounds)) return 0;
  return Math.round(pounds * 100);
}

function parseMonthHeader(header: string): string | null {
  // "Feb 2023" -> "2023-02-01"
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const match = header.trim().match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/);
  if (!match) return null;
  return `${match[2]}-${months[match[1]]}-01`;
}

async function seed() {
  console.log("Reading CSV...");
  const csvPath = path.resolve(__dirname, "../../Net_Worth_Tracker_-_Overview.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").map((line) => {
    // Simple CSV parse — split by comma but handle quoted values
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  // Row 3 (index 2) has month headers starting at column 3
  const headerRow = lines[2];
  const monthColumns: { colIndex: number; monthISO: string }[] = [];
  for (let i = 3; i < headerRow.length; i++) {
    const monthISO = parseMonthHeader(headerRow[i]);
    if (monthISO) {
      monthColumns.push({ colIndex: i, monthISO });
    }
  }
  console.log(`Found ${monthColumns.length} months: ${monthColumns[0]?.monthISO} → ${monthColumns[monthColumns.length - 1]?.monthISO}`);

  // Build a map of CSV row name → data row
  const rowMap = new Map<string, string[]>();
  for (const line of lines) {
    const name = line[2]?.trim();
    if (name) {
      rowMap.set(name, line);
    }
  }

  // Step 1: Upsert accounts
  console.log("Upserting accounts...");
  const accountRows = LEAF_ACCOUNTS.map((a) => ({
    name: a.name,
    category: a.category,
    side: a.side,
    display_order: a.displayOrder,
    is_active: true,
  }));

  // First delete existing accounts to avoid duplicates on re-run
  // Then insert fresh
  for (const acc of accountRows) {
    const { error: delErr } = await supabase
      .from("accounts")
      .delete()
      .eq("name", acc.name);
    if (delErr) console.warn(`Warning deleting ${acc.name}:`, delErr.message);
  }

  const { data: insertedAccounts, error: accError } = await supabase
    .from("accounts")
    .insert(accountRows)
    .select("id, name");

  if (accError) {
    console.error("Failed to insert accounts:", accError.message);
    process.exit(1);
  }

  console.log(`Inserted ${insertedAccounts.length} accounts`);
  const accountIdMap = new Map<string, string>();
  for (const acc of insertedAccounts) {
    accountIdMap.set(acc.name, acc.id);
  }

  // Step 2: Build snapshot rows
  console.log("Building snapshot rows...");
  const snapshotRows: { account_id: string; month: string; balance_pence: number }[] = [];

  // Get mortgage row data for computing full property value
  const mortgageRow = rowMap.get("Mortgage Remaining");
  const equityRow = rowMap.get("Home Equity (absolute)");

  for (const leaf of LEAF_ACCOUNTS) {
    const dataRow = rowMap.get(leaf.csvRowName);
    if (!dataRow) {
      console.warn(`CSV row not found for: ${leaf.csvRowName}`);
      continue;
    }

    const accountId = accountIdMap.get(leaf.name);
    if (!accountId) {
      console.warn(`Account ID not found for: ${leaf.name}`);
      continue;
    }

    for (const { colIndex, monthISO } of monthColumns) {
      let balancePence: number;

      if (leaf.csvRowName === "Home Equity (absolute)") {
        // Store FULL property value (equity + mortgage) so Net Worth = Assets - Liabilities works
        const equity = parsePounds(equityRow?.[colIndex] || "");
        const mortgage = parsePounds(mortgageRow?.[colIndex] || "");
        balancePence = equity + mortgage;
      } else {
        balancePence = parsePounds(dataRow[colIndex] || "");
      }

      snapshotRows.push({
        account_id: accountId,
        month: monthISO,
        balance_pence: balancePence,
      });
    }
  }

  // Filter out months where ALL accounts have zero balance (future months with no data)
  const monthTotals = new Map<string, number>();
  for (const row of snapshotRows) {
    monthTotals.set(row.month, (monthTotals.get(row.month) || 0) + Math.abs(row.balance_pence));
  }
  const filteredRows = snapshotRows.filter((row) => (monthTotals.get(row.month) || 0) > 0);

  // Step 3: Delete existing snapshots and insert
  console.log(`Inserting ${filteredRows.length} snapshots (filtered from ${snapshotRows.length})...`);

  // Delete existing snapshots for these accounts
  for (const accountId of accountIdMap.values()) {
    await supabase.from("monthly_snapshots").delete().eq("account_id", accountId);
  }

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < filteredRows.length; i += batchSize) {
    const batch = filteredRows.slice(i, i + batchSize);
    const { error } = await supabase.from("monthly_snapshots").insert(batch);
    if (error) {
      console.error(`Batch insert failed at offset ${i}:`, error.message);
      process.exit(1);
    }
  }

  console.log("Done! Verifying spot checks...");

  // Spot checks
  await spotCheck("2023-02-01", 6892900);
  await spotCheck("2025-02-01", 20983900);
  await spotCheck("2026-01-01", 41822300);
}

async function spotCheck(month: string, expectedNetWorthPence: number) {
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("balance_pence, accounts!inner(side)")
    .eq("month", month);

  if (error) {
    console.error(`Spot check ${month} failed:`, error.message);
    return;
  }

  let netWorth = 0;
  for (const row of data as any[]) {
    const side = row.accounts?.side;
    if (side === "asset") {
      netWorth += row.balance_pence;
    } else if (side === "liability") {
      netWorth -= row.balance_pence;
    }
  }

  const expected = expectedNetWorthPence;
  const match = netWorth === expected;
  console.log(
    `  ${month}: Net Worth = £${(netWorth / 100).toLocaleString()} (expected £${(expected / 100).toLocaleString()}) ${match ? "✓" : "✗ MISMATCH"}`
  );
}

seed().catch(console.error);
