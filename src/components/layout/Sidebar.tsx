"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
};

const PRIMARY: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, hint: "Home" },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

const PLAN: NavItem[] = [
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/projections", label: "Projections", icon: TrendingUp, hint: "FI / SWR" },
];

function NavLink({
  href,
  label,
  icon: Icon,
  hint,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-emerald-500" : "text-muted-foreground group-hover:text-sidebar-foreground"
        )}
      />
      <span className="truncate">{label}</span>
      {hint && (
        <span className="ml-auto text-[10px] font-medium tracking-wide text-muted-foreground/60 uppercase">
          {hint}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
      {children}
    </p>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const allItems = [...PRIMARY, ...PLAN];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 w-60 bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 px-5 shrink-0">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]">
            <span className="text-[13px] font-bold leading-none">£</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
              Wealth OS
            </span>
            <span className="text-[10px] text-muted-foreground/70">personal finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <SectionLabel>Money</SectionLabel>
          <div className="space-y-0.5">
            {PRIMARY.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </div>
          <SectionLabel>Plan</SectionLabel>
          <div className="space-y-0.5">
            {PLAN.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </div>

          {/* "What's new" marketing card */}
          <div className="mt-6 mx-1 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
              <Sparkles className="h-3 w-3" />
              New
            </div>
            <p className="mt-1 text-[12px] font-medium text-sidebar-foreground leading-snug">
              Retirement & SWR drawdown planner
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
              Model 30-year withdrawals at any safe rate.
            </p>
            <Link
              href="/projections"
              className="mt-2 inline-flex text-[11px] font-medium text-emerald-500 hover:text-emerald-400"
            >
              Try it →
            </Link>
          </div>
        </nav>

        {/* Bottom: user + theme */}
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/60 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-indigo-500 text-[11px] font-semibold text-white">
              L
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-medium text-sidebar-foreground">Luca</p>
              <p className="truncate text-[10px] text-muted-foreground">GBP · London</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border bg-sidebar/95 backdrop-blur">
        <div className="flex items-center justify-around h-16">
          {allItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
