"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Upload, Trash2 } from "lucide-react";
import { deleteStatement } from "@/app/actions/transactions";
import type { Statement, StatementStatus } from "@/types";

interface StatementsHistoryProps {
  statements: Statement[];
  onImport: () => void;
}

const STATUS_VARIANT: Record<StatementStatus, "secondary" | "default" | "outline"> = {
  pending: "outline",
  imported: "secondary",
  reconciled: "default",
};

const STATUS_CLASS: Record<StatementStatus, string> = {
  pending: "border-yellow-500/50 text-yellow-600 dark:text-yellow-400",
  imported: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  reconciled: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function StatementsHistory({ statements, onImport }: StatementsHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    await deleteStatement(deletingId);
    setDeleting(false);
    setDeletingId(null);
  }

  if (statements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-1" />
            Import Statement
          </Button>
        </div>
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No statements imported yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imported Statements</CardTitle>
          <CardAction>
            <Button size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-1" />
              Import Statement
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((stmt) => (
                <TableRow key={stmt.id}>
                  <TableCell className="font-medium">
                    {stmt.source_account}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stmt.statement_date
                      ? format(parseISO(stmt.statement_date), "dd MMM yyyy")
                      : format(parseISO(stmt.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {stmt.file_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs capitalize", STATUS_CLASS[stmt.status])}
                    >
                      {stmt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {stmt.transaction_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                    {stmt.total_debits_pence > 0
                      ? formatGBP(stmt.total_debits_pence)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                    {stmt.total_credits_pence > 0
                      ? formatGBP(stmt.total_credits_pence)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeletingId(stmt.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Statement</DialogTitle>
            <DialogDescription>
              This will permanently delete the statement and all of its imported
              transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
