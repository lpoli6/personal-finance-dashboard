"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatGBP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Ban,
} from "lucide-react";
import {
  updateTransactionCategory,
  excludeTransaction,
} from "@/app/actions/transactions";
import type {
  TransactionWithCategory,
  TransactionCategory,
  TransactionDirection,
} from "@/types";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: TransactionCategory[];
}

const PAGE_SIZE = 25;

export function TransactionList({
  transactions,
  categories,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter transactions
  const filtered = useMemo(() => {
    let result = transactions;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          (t.original_description ?? "").toLowerCase().includes(lower)
      );
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorised") {
        result = result.filter((t) => !t.transaction_categories);
      } else {
        result = result.filter(
          (t) => t.transaction_categories?.id === categoryFilter
        );
      }
    }

    if (directionFilter !== "all") {
      result = result.filter((t) => t.direction === directionFilter);
    }

    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }

    return result;
  }, [transactions, search, categoryFilter, directionFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset page when filters change
  const resetPage = () => setPage(1);

  async function handleCategoryChange(transactionId: string, categoryId: string) {
    setSaving(true);
    await updateTransactionCategory(transactionId, categoryId);
    setSaving(false);
    setEditingId(null);
  }

  async function handleExclude(transactionId: string) {
    setSaving(true);
    await excludeTransaction(transactionId);
    setSaving(false);
    setEditingId(null);
  }

  // Sort categories alphabetically for the dropdown
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No transactions imported yet. Use the Import Statement button to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="pl-8"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val as string);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorised">Uncategorised</SelectItem>
            {sortedCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={directionFilter}
          onValueChange={(val) => {
            setDirectionFilter(val as string);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetPage();
          }}
          className="w-[140px]"
          placeholder="From"
        />

        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetPage();
          }}
          className="w-[140px]"
          placeholder="To"
        />

        {(search || categoryFilter !== "all" || directionFilter !== "all" || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setDirectionFilter("all");
              setDateFrom("");
              setDateTo("");
              resetPage();
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Transaction table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[140px]">Category</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[100px]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((t) => (
                <TableRow
                  key={t.id}
                  className={cn(
                    "cursor-pointer",
                    t.is_excluded && "opacity-40",
                    editingId === t.id && "bg-muted/50"
                  )}
                  onClick={() =>
                    setEditingId(editingId === t.id ? null : t.id)
                  }
                >
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(t.date), "dd MMM yy")}
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {t.description}
                  </TableCell>
                  <TableCell>
                    {editingId === t.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={t.category_id ?? "none"}
                          onValueChange={(val) => {
                            if (val !== "none") {
                              handleCategoryChange(t.id, val as string);
                            }
                          }}
                          disabled={saving}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExclude(t.id);
                          }}
                          disabled={saving || t.is_excluded}
                          title="Exclude transaction"
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : t.transaction_categories ? (
                      <Badge variant="secondary" className="text-xs">
                        {t.transaction_categories.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Uncategorised
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      t.direction === "debit"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {t.direction === "debit" ? "-" : "+"}
                    {formatGBP(t.amount_pence)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {t.source_account ?? "Unknown"}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
