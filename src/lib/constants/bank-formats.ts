export type BankFormatId = "amex" | "monzo" | "first-direct" | "revolut" | "joint-account";
export type StatementType = "pdf" | "csv";

export interface BankFormat {
  id: BankFormatId;
  label: string;
  statementType: StatementType;
  csv?: {
    dateColumn: string;
    descriptionColumn: string;
    amountColumn?: string;
    debitColumn?: string;
    creditColumn?: string;
    dateFormat: string;
    skipRows?: number;
    hasHeader: boolean;
    invertSign?: boolean;
  };
}

export const BANK_FORMATS: BankFormat[] = [
  {
    id: "amex",
    label: "American Express (PDF)",
    statementType: "pdf",
  },
  {
    id: "monzo",
    label: "Monzo (CSV)",
    statementType: "csv",
    csv: {
      dateColumn: "Date",
      descriptionColumn: "Name",
      amountColumn: "Amount",
      dateFormat: "dd/MM/yyyy",
      hasHeader: true,
    },
  },
  {
    id: "first-direct",
    label: "First Direct (CSV)",
    statementType: "csv",
    csv: {
      dateColumn: "Date",
      descriptionColumn: "Description",
      debitColumn: "Debit",
      creditColumn: "Credit",
      dateFormat: "dd/MM/yyyy",
      hasHeader: true,
    },
  },
  {
    id: "revolut",
    label: "Revolut (CSV)",
    statementType: "csv",
    csv: {
      dateColumn: "Started Date",
      descriptionColumn: "Description",
      amountColumn: "Amount",
      dateFormat: "yyyy-MM-dd HH:mm:ss",
      hasHeader: true,
    },
  },
  {
    id: "joint-account",
    label: "Joint Account (CSV)",
    statementType: "csv",
    csv: {
      dateColumn: "Date",
      descriptionColumn: "Description",
      debitColumn: "Debit",
      creditColumn: "Credit",
      dateFormat: "dd/MM/yyyy",
      hasHeader: true,
    },
  },
];

export function getBankFormat(id: string): BankFormat | undefined {
  return BANK_FORMATS.find((f) => f.id === id);
}
