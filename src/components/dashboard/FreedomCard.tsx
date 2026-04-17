"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { formatGBP } from "@/lib/utils/currency";
import type { CategoryTotals } from "@/types";

interface FreedomCardProps {
  current: CategoryTotals;
}

/**
 * A small dashboard teaser for the full SWR / Retirement planner.
 * Liquid investable = ISA + GIA + Pension (property & cash excluded).
 * At a 4% SWR over 30 years, annual withdraw = liquid × 0.04.
 */
export function FreedomCard({ current }: FreedomCardProps) {
  const liquid = current.isaTotal + current.investmentTotal + current.pensionTotal;
  const annual = Math.round(liquid * 0.04);
  const monthly = Math.round(annual / 12);

  const bands = [
    { rate: 3, label: "Cautious" },
    { rate: 4, label: "Classic" },
    { rate: 5, label: "Aggressive" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 lg:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500">
              Financial freedom
            </p>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            If you stopped today
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Based on your liquid investable assets (ISA + GIA + Pension) and a 4%
            safe withdrawal rate over 30 years.
          </p>
        </div>
        <Link
          href="/projections"
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          Full planner
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Monthly income (4% SWR)
          </p>
          <p className="font-display text-4xl lg:text-[40px] font-semibold tabular-nums mt-1 text-foreground">
            {formatGBP(monthly)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {formatGBP(annual)} / year · from {formatGBP(liquid)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bands.map(({ rate, label }) => {
            const m = Math.round((liquid * (rate / 100)) / 12);
            return (
              <div
                key={rate}
                className="rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {rate}% · {label}
                </p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  {formatGBP(m)}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
