import { PageHeader } from "@/components/layout/PageHeader";

export default function SubscriptionsPage() {
  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Track recurring costs and renewal dates"
      />
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Subscription tracker and cost breakdown will appear here.
      </div>
    </>
  );
}
