import Papa from "papaparse";
import { parse as parseDate, format } from "date-fns";
import type { BankFormat } from "@/lib/constants/bank-formats";
import type { ParsedTransaction } from "@/types";

export function parseCSVStatement(
  csvText: string,
  bankFormat: BankFormat
): ParsedTransaction[] {
  const config = bankFormat.csv;
  if (!config) throw new Error(`No CSV config for ${bankFormat.id}`);

  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: config.hasHeader,
    skipEmptyLines: true,
  });

  const transactions: ParsedTransaction[] = [];

  for (const row of data) {
    const rawDate = row[config.dateColumn]?.trim();
    const rawDescription = row[config.descriptionColumn]?.trim();
    if (!rawDate || !rawDescription) continue;

    // Parse date
    let parsedDate: Date;
    try {
      parsedDate = parseDate(rawDate, config.dateFormat, new Date());
    } catch {
      continue;
    }
    const dateStr = format(parsedDate, "yyyy-MM-dd");

    // Parse amount and direction
    let amountPence: number;
    let direction: "debit" | "credit";

    if (config.amountColumn) {
      const rawAmount = parseFloat(row[config.amountColumn] || "0");
      if (isNaN(rawAmount)) continue;
      const adjusted = config.invertSign ? -rawAmount : rawAmount;
      amountPence = Math.round(Math.abs(adjusted) * 100);
      direction = adjusted < 0 ? "debit" : "credit";
    } else if (config.debitColumn && config.creditColumn) {
      const debit = parseFloat(row[config.debitColumn] || "0");
      const credit = parseFloat(row[config.creditColumn] || "0");
      if (!isNaN(debit) && debit > 0) {
        amountPence = Math.round(debit * 100);
        direction = "debit";
      } else if (!isNaN(credit) && credit > 0) {
        amountPence = Math.round(credit * 100);
        direction = "credit";
      } else {
        continue;
      }
    } else {
      continue;
    }

    if (amountPence === 0) continue;

    transactions.push({
      date: dateStr,
      description: rawDescription,
      originalDescription: rawDescription,
      amountPence,
      direction,
      categoryId: null,
      categoryName: null,
      confidence: null,
      foreignAmount: null,
      foreignCurrency: null,
      isDuplicate: false,
      duplicateOf: null,
      excluded: false,
    });
  }

  return transactions;
}
