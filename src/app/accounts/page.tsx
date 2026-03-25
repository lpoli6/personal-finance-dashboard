import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountsPage() {
  return (
    <>
      <PageHeader
        title="Accounts"
        description="Manage your accounts and view balances"
      />
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Account list and management tools will appear here.
      </div>
    </>
  );
}
