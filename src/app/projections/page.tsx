import { PageHeader } from "@/components/layout/PageHeader";

export default function ProjectionsPage() {
  return (
    <>
      <PageHeader
        title="Projections"
        description="Pension modelling and investment growth scenarios"
      />
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Pension modeller and investment projections will appear here.
      </div>
    </>
  );
}
