import type { CategoryRule, ParsedTransaction, TransactionCategory } from "@/types";

export function applyCategoryRules(
  transactions: ParsedTransaction[],
  rules: CategoryRule[],
  categories: TransactionCategory[]
): ParsedTransaction[] {
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return transactions.map((tx) => {
    if (tx.categoryId) return tx;

    const upperDesc = tx.description.toUpperCase();
    for (const rule of sortedRules) {
      if (upperDesc.includes(rule.pattern.toUpperCase())) {
        const cat = catMap.get(rule.category_id);
        return {
          ...tx,
          categoryId: rule.category_id,
          categoryName: cat?.name || null,
          confidence: 1.0,
        };
      }
    }
    return tx;
  });
}

export function checkDuplicates(
  newTransactions: ParsedTransaction[],
  existingTransactions: { id: string; date: string; amount_pence: number; source_account: string | null }[],
  sourceAccount: string
): ParsedTransaction[] {
  return newTransactions.map((tx) => {
    const txDate = new Date(tx.date).getTime();

    for (const existing of existingTransactions) {
      if (existing.source_account !== sourceAccount) continue;

      const existDate = new Date(existing.date).getTime();
      const dayDiff = Math.abs(txDate - existDate) / (1000 * 60 * 60 * 24);

      if (dayDiff <= 1 && existing.amount_pence === tx.amountPence) {
        return { ...tx, isDuplicate: true, duplicateOf: existing.id };
      }
    }
    return tx;
  });
}
