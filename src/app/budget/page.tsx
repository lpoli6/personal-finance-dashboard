import { PageHeader } from "@/components/layout/PageHeader";

export default function BudgetPage() {
  return (
    <>
      <PageHeader
        title="Budget"
        description="Monthly budget overview and future planning"
      />
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Budget waterfall and planned expenses will appear here.
      </div>
    </>
  );
}
