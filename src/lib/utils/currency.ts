const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

/**
 * Format pence as GBP string. e.g. 6892900 → "£68,929.00"
 */
export function formatGBP(pence: number): string {
  return gbpFormatter.format(pence / 100);
}

/**
 * Parse a pounds string to pence. e.g. "£68,929" → 6892900, "68929.50" → 6892950
 */
export function parsePounds(str: string): number {
  const cleaned = str.replace(/[£,\s]/g, "");
  const pounds = parseFloat(cleaned);
  if (isNaN(pounds)) {
    throw new Error(`Cannot parse "${str}" as pounds`);
  }
  return Math.round(pounds * 100);
}
