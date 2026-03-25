"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/projections", label: "Projections", icon: TrendingUp },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  expanded,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg font-medium transition-colors",
        expanded
          ? "gap-3 px-3 py-2 text-sm"
          : "justify-center w-12 h-10 mx-auto",
        active
          ? "bg-emerald-500/10 text-emerald-500"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {expanded && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-sidebar transition-all duration-300 ease-in-out",
          expanded ? "md:w-64" : "md:w-16"
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            "flex h-14 items-center shrink-0",
            expanded ? "px-5 gap-3" : "justify-center"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">
            £
          </div>
          {expanded && (
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground whitespace-nowrap">
              Finance
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 py-4 space-y-1",
            expanded ? "px-3" : "px-2"
          )}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);

            if (!expanded) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center justify-center rounded-lg font-medium transition-colors w-12 h-10 mx-auto",
                          active
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      />
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={Icon}
                active={active}
                expanded={expanded}
              />
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border py-3",
            expanded
              ? "px-3 flex items-center justify-between"
              : "px-2 space-y-2"
          )}
        >
          <div className={cn(expanded ? "" : "flex justify-center")}>
            <ThemeToggle />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              expanded ? "h-8 w-8" : "h-10 w-12 mx-auto"
            )}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar">
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
