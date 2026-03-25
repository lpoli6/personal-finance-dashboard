"use client";

import { useState } from "react";
import { CategoryGroup } from "./CategoryGroup";
import { AccountFormDialog } from "./AccountFormDialog";
import { PropertyMortgageDetails } from "./PropertyMortgageDetails";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { AccountWithBalance, AccountCategory, Property, Mortgage } from "@/types";

interface AccountsShellProps {
  accounts: AccountWithBalance[];
  properties: Property[];
  mortgages: Mortgage[];
  latestMonth: string | null;
}

const CATEGORY_ORDER: AccountCategory[] = ["cash", "isa", "pension", "investment", "property"];
const CATEGORY_LABELS: Record<AccountCategory, string> = {
  cash: "Cash",
  isa: "ISA",
  pension: "Pension",
  investment: "Investments",
  property: "Property",
};

export function AccountsShell({ accounts, properties, mortgages, latestMonth }: AccountsShellProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    accounts: accounts.filter((a) => a.category === cat),
  }));

  // Find property details for property-category accounts
  const propertyAccountId = accounts.find(
    (a) => a.category === "property" && a.side === "asset"
  )?.id;
  const mortgageAccountId = accounts.find(
    (a) => a.category === "property" && a.side === "liability"
  )?.id;

  const property = properties.find((p) => p.account_id === propertyAccountId) || null;
  const mortgage = mortgages.find((m) => m.account_id === mortgageAccountId) || null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Account
        </Button>
      </div>

      {grouped.map((group) => (
        <CategoryGroup
          key={group.category}
          category={group.category}
          label={group.label}
          accounts={group.accounts}
          allAccounts={accounts}
          onEdit={setEditAccount}
        />
      ))}

      {(property || mortgage) && (
        <PropertyMortgageDetails
          property={property}
          mortgage={mortgage}
          propertyAccountId={propertyAccountId || null}
          mortgageAccountId={mortgageAccountId || null}
        />
      )}

      <AccountFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
      />

      {editAccount && (
        <AccountFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditAccount(null); }}
          account={editAccount}
          accounts={accounts}
        />
      )}
    </div>
  );
}
