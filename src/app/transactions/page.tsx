import { PageHeader } from "@/components/layout/PageHeader";

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Import, categorise, and analyse spending"
      />
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Transaction import and spending analysis will appear here.
      </div>
    </>
  );
}
