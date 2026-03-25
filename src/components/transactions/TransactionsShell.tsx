"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "./ImportWizard";
import { SpendingOverview } from "./SpendingOverview";
import { TransactionList } from "./TransactionList";
import { StatementsHistory } from "./StatementsHistory";
import { Upload } from "lucide-react";
import type {
  TransactionWithCategory,
  TransactionCategory,
  CategoryRule,
  Statement,
} from "@/types";

interface TransactionsShellProps {
  transactions: TransactionWithCategory[];
  categories: TransactionCategory[];
  rules: CategoryRule[];
  statements: Statement[];
}

export function TransactionsShell({
  transactions,
  categories,
  rules,
  statements,
}: TransactionsShellProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Import Statement
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SpendingOverview transactions={transactions} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList
            transactions={transactions}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="statements">
          <StatementsHistory
            statements={statements}
            onImport={() => setImportOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <ImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        categories={categories}
        rules={rules}
        existingTransactions={transactions}
      />
    </div>
  );
}
