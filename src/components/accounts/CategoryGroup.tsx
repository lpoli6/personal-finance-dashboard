"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { reorderAccount } from "@/app/actions/accounts";
import { toast } from "sonner";
import type { AccountWithBalance, AccountCategory } from "@/types";

interface CategoryGroupProps {
  category: AccountCategory;
  label: string;
  accounts: AccountWithBalance[];
  allAccounts: AccountWithBalance[];
  onEdit: (account: AccountWithBalance) => void;
}

export function CategoryGroup({ category, label, accounts, onEdit }: CategoryGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const inactiveAccounts = accounts.filter((a) => !a.is_active);

  const categoryTotal = activeAccounts.reduce((sum, a) => {
    const bal = a.latestBalancePence || 0;
    return sum + (a.side === "asset" ? bal : -bal);
  }, 0);

  const handleReorder = async (id: string, currentOrder: number, direction: "up" | "down") => {
    const sorted = [...activeAccounts].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((a) => a.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await reorderAccount(id, other.display_order);
    await reorderAccount(other.id, currentOrder);
    toast.success("Reordered");
  };

  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base">{label}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {activeAccounts.length}
            </Badge>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {formatGBP(Math.abs(categoryTotal))}
          </span>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {activeAccounts
              .sort((a, b) => a.display_order - b.display_order)
              .map((account, idx) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2.5 gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm truncate">{account.name}</span>
                    {account.side === "liability" && (
                      <Badge variant="destructive" className="text-[10px] shrink-0">
                        Liability
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn(
                      "text-sm font-medium tabular-nums w-28 text-right",
                      account.side === "liability" && "text-red-600 dark:text-red-400"
                    )}>
                      {account.latestBalancePence !== null
                        ? formatGBP(account.latestBalancePence)
                        : "—"}
                    </span>

                    <div className="flex items-center gap-0.5 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(account.id, account.display_order, "up");
                        }}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === activeAccounts.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(account.id, account.display_order, "down");
                        }}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(account);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            {inactiveAccounts.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Inactive</p>
                {inactiveAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between py-1.5 opacity-50"
                  >
                    <span className="text-sm">{account.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(account)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
