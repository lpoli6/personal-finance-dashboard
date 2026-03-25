export function buildAmexExtractionPrompt(pdfText: string, statementYear: number): string {
  return `You are a financial data extraction assistant. Extract ALL transactions from this American Express statement.

RULES:
- The statement covers a period that may cross months. Dates like "Feb 7" are in ${statementYear}, "Mar 7" is in ${statementYear}.
- Use the Transaction Date (not Process Date) for the date field.
- Amount is always positive in the source. Determine direction:
  - "CR" suffix or "PAYMENT RECEIVED" = credit
  - All others = debit
- Include "PAYMENT RECEIVED - THANK YOU" as direction: "credit"
- Skip "Total new spend transactions" summary lines
- Skip "OTHER ACCOUNT TRANSACTIONS" section (rewards/points)
- For foreign currency transactions, capture the original amount and currency
- Clean merchant names: remove trailing location (e.g., "LONDON", "NEW YORK"), remove transaction reference numbers and card numbers, standardise known names (e.g., "AMZN MKTP" → "Amazon")

Return ONLY a valid JSON array. Each element:
{
  "date": "YYYY-MM-DD",
  "description": "Clean merchant name",
  "originalDescription": "Raw transaction details text from the PDF",
  "amountPence": <positive integer, pounds * 100>,
  "direction": "debit" | "credit",
  "foreignAmount": "<amount>" | null,
  "foreignCurrency": "EUR" | "USD" | null
}

STATEMENT TEXT:
${pdfText}`;
}
