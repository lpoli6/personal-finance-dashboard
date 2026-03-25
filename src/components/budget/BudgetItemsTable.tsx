"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import { updateBudgetItem, createBudgetItem } from "@/app/actions/budget";
import { toast } from "sonner";
import type { BudgetItem } from "@/types";

interface BudgetItemsTableProps {
  items: BudgetItem[];
}

const TYPE_COLORS: Record<string, string> = {
  income: "bg-green-500/10 text-green-700 dark:text-green-400",
  fixed: "bg-red-500/10 text-red-700 dark:text-red-400",
  savings: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  discretionary: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const TYPE_ORDER = ["income", "fixed", "savings", "discretionary"];

export function BudgetItemsTable({ items }: BudgetItemsTableProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState("fixed");
  const [isSaving, setIsSaving] = useState(false);

  const sorted = [...items].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  const subtotals = TYPE_ORDER.map((type) => ({
    type,
    total: items.filter((i) => i.type === type).reduce((s, i) => s + i.amount_pence, 0),
  }));

  const handleEditSave = async (id: string) => {
    setIsSaving(true);
    const pence = Math.round(parseFloat(editAmount) * 100);
    const result = await updateBudgetItem(id, { amount_pence: pence });
    setIsSaving(false);
    if (result.success) {
      toast.success("Updated");
      setEditId(null);
    } else {
      toast.error(result.error || "Failed");
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newAmount) return;
    setIsSaving(true);
    const result = await createBudgetItem({
      name: newName.trim(),
      amount_pence: Math.round(parseFloat(newAmount) * 100),
      type: newType as BudgetItem["type"],
      display_order: items.length,
    });
    setIsSaving(false);
    if (result.success) {
      toast.success("Added");
      setAddOpen(false);
      setNewName("");
      setNewAmount("");
    } else {
      toast.error(result.error || "Failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Budget Items</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setAddOpen(!addOpen)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right w-36">Amount</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-xs ${TYPE_COLORS[item.type] || ""}`}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editId === item.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="h-7 w-28 text-right text-sm ml-auto"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(item.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                    />
                  ) : (
                    <span
                      className="text-sm tabular-nums cursor-pointer hover:underline"
                      onClick={() => {
                        setEditId(item.id);
                        setEditAmount((item.amount_pence / 100).toString());
                      }}
                    >
                      {formatGBP(item.amount_pence)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editId === item.id && (
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditSave(item.id)} disabled={isSaving}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {addOpen && (
              <TableRow>
                <TableCell>
                  <Input className="h-7 text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
                </TableCell>
                <TableCell>
                  <select className="h-7 text-xs border rounded px-1 bg-background" value={newType} onChange={(e) => setNewType(e.target.value)}>
                    {TYPE_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </TableCell>
                <TableCell className="text-right">
                  <Input type="number" step="0.01" className="h-7 w-28 text-right text-sm ml-auto" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAdd} disabled={isSaving}><Check className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddOpen(false)}><X className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            {subtotals.filter((s) => s.total > 0).map((s) => (
              <TableRow key={s.type}>
                <TableCell className="text-xs text-muted-foreground" colSpan={2}>
                  Total {s.type}
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {formatGBP(s.total)}
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
