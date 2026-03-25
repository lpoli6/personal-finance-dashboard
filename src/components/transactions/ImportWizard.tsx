"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadStep } from "./UploadStep";
import { PreviewTable } from "./PreviewTable";
import { DuplicateCheck } from "./DuplicateCheck";
import { ConfirmImport } from "./ConfirmImport";
import { parseCSVStatement } from "@/lib/utils/csv-parsers";
import { applyCategoryRules, checkDuplicates } from "@/lib/utils/categorise";
import { getBankFormat } from "@/lib/constants/bank-formats";
import type {
  ParsedTransaction,
  TransactionCategory,
  CategoryRule,
  TransactionWithCategory,
} from "@/types";
import type { BankFormatId } from "@/lib/constants/bank-formats";

type ImportStep = "upload" | "preview" | "duplicates" | "confirm";

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TransactionCategory[];
  rules: CategoryRule[];
  existingTransactions: TransactionWithCategory[];
}

const STEP_TITLES: Record<ImportStep, string> = {
  upload: "Upload Statement",
  preview: "Review Transactions",
  duplicates: "Check Duplicates",
  confirm: "Confirm Import",
};

const STEP_DESCRIPTIONS: Record<ImportStep, string> = {
  upload: "Select your bank format and upload a statement file.",
  preview: "Review parsed transactions and adjust categories.",
  duplicates: "Review potential duplicate transactions.",
  confirm: "Review summary and import transactions.",
};

export function ImportWizard({
  open,
  onOpenChange,
  categories,
  rules,
  existingTransactions,
}: ImportWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<ImportStep>("upload");
  const [bankFormatId, setBankFormatId] = useState<BankFormatId | "">("");
  const [statementId, setStatementId] = useState<string | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const resetWizard = useCallback(() => {
    setStep("upload");
    setBankFormatId("");
    setStatementId(null);
    setParsedTransactions([]);
    setIsProcessing(false);
    setProgressMessage("");
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetWizard();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetWizard]
  );

  const handleUploadComplete = useCallback(
    async (
      newStatementId: string,
      newBankFormatId: BankFormatId,
      file: File
    ) => {
      setStatementId(newStatementId);
      setBankFormatId(newBankFormatId);
      setIsProcessing(true);

      try {
        const bankFormat = getBankFormat(newBankFormatId);
        if (!bankFormat) throw new Error("Unknown bank format");

        let transactions: ParsedTransaction[];

        if (bankFormat.statementType === "csv") {
          setProgressMessage("Parsing CSV...");
          const csvText = await file.text();
          transactions = parseCSVStatement(csvText, bankFormat);
        } else {
          setProgressMessage("Extracting transactions from PDF...");
          const res = await fetch("/api/parse-statement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              statementId: newStatementId,
              bankFormatId: newBankFormatId,
            }),
          });
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || "Failed to parse PDF");
          }
          const data = await res.json();
          transactions = data.transactions as ParsedTransaction[];
        }

        if (transactions.length === 0) {
          throw new Error("No transactions found in statement");
        }

        // Apply category rules
        setProgressMessage("Applying category rules...");
        transactions = applyCategoryRules(transactions, rules, categories);

        // Call LLM categorisation for uncategorised transactions
        const uncategorised = transactions
          .map((t, i) => ({ ...t, _index: i }))
          .filter((t) => !t.categoryId);

        if (uncategorised.length > 0) {
          setProgressMessage(
            `Categorising ${uncategorised.length} transactions with AI...`
          );
          try {
            const res = await fetch("/api/categorise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transactions: uncategorised.map((t) => ({
                  index: t._index,
                  description: t.description,
                  amountPence: t.amountPence,
                  direction: t.direction,
                })),
              }),
            });
            if (res.ok) {
              const { mappings } = await res.json();
              for (const m of mappings) {
                if (m.categoryId && transactions[m.index]) {
                  transactions[m.index] = {
                    ...transactions[m.index],
                    categoryId: m.categoryId,
                    categoryName: m.categoryName || null,
                    confidence: m.confidence,
                  };
                }
              }
            }
          } catch {
            // AI categorisation is best-effort; continue without it
          }
        }

        // Check duplicates
        setProgressMessage("Checking for duplicates...");
        transactions = checkDuplicates(
          transactions,
          existingTransactions.map((t) => ({
            id: t.id,
            date: t.date,
            amount_pence: t.amount_pence,
            source_account: t.source_account,
          })),
          newBankFormatId
        );

        setParsedTransactions(transactions);
        setStep("preview");
      } catch (err: any) {
        setProgressMessage(`Error: ${err.message}`);
        // Stay on upload step so user can retry
        setTimeout(() => setProgressMessage(""), 4000);
      } finally {
        setIsProcessing(false);
      }
    },
    [rules, categories, existingTransactions]
  );

  const handlePreviewNext = useCallback(() => {
    const hasDuplicates = parsedTransactions.some((t) => t.isDuplicate);
    if (hasDuplicates) {
      setStep("duplicates");
    } else {
      setStep("confirm");
    }
  }, [parsedTransactions]);

  const handleDuplicatesResolved = useCallback(
    (resolved: ParsedTransaction[]) => {
      setParsedTransactions(resolved);
      setStep("confirm");
    },
    []
  );

  const handleImportComplete = useCallback(() => {
    handleOpenChange(false);
    router.refresh();
  }, [handleOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
          <DialogDescription>{STEP_DESCRIPTIONS[step]}</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <UploadStep
            onUploadComplete={handleUploadComplete}
            isProcessing={isProcessing}
            progressMessage={progressMessage}
          />
        )}

        {step === "preview" && (
          <PreviewTable
            transactions={parsedTransactions}
            categories={categories}
            onTransactionsChange={setParsedTransactions}
            onNext={handlePreviewNext}
            onBack={() => setStep("upload")}
            bankFormatId={bankFormatId as BankFormatId}
          />
        )}

        {step === "duplicates" && (
          <DuplicateCheck
            transactions={parsedTransactions}
            existingTransactions={existingTransactions}
            onResolved={handleDuplicatesResolved}
            onBack={() => setStep("preview")}
          />
        )}

        {step === "confirm" && statementId && (
          <ConfirmImport
            transactions={parsedTransactions}
            statementId={statementId}
            sourceAccount={bankFormatId as string}
            onImportComplete={handleImportComplete}
            onBack={() => {
              const hasDuplicates = parsedTransactions.some(
                (t) => t.isDuplicate
              );
              setStep(hasDuplicates ? "duplicates" : "preview");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
