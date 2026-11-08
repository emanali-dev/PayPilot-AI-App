"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Navigation, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const hideLabel = collapsed ? "lg:hidden" : undefined;

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-[width,transform] duration-200",
          collapsed ? "lg:w-[72px]" : "lg:w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Link href="/" className="flex h-16 items-center gap-3 px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Navigation className="size-5" aria-hidden />
          </span>
          <span className={cn("font-display text-lg font-semibold", hideLabel)}>PayPilot AI</span>
        </Link>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
                  active && "bg-primary/15 text-foreground",
                  collapsed && "lg:justify-center lg:px-0",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} aria-hidden />
                <span className={hideLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mb-2 hidden h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="mx-auto size-[18px]" /> : <><PanelLeftClose className="size-[18px]" />Collapse</>}
          </button>
          <div className={cn("flex items-center gap-3 rounded-xl bg-elevated/50 p-2", collapsed && "lg:justify-center")}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-aqua/20 text-sm font-semibold text-aqua">MO</span>
            <div className={cn("min-w-0", hideLabel)}>
              <p className="truncate text-sm font-medium">Maya Okafor</p>
              <p className="truncate text-xs text-muted-foreground">Freelance designer</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <button className="grid size-10 place-items-center rounded-xl hover:bg-elevated lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <label className="relative max-w-md flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              placeholder="Search invoices, clients, payments"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground"
            />
          </label>
          <span className="ml-auto hidden rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning md:inline">
            Demo mode
          </span>
          <button className="relative grid size-10 place-items-center rounded-xl hover:bg-elevated" aria-label="Notifications">
            <Bell className="size-5 text-muted-foreground" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger" aria-hidden />
          </button>
          <button className="grid size-9 place-items-center rounded-full bg-aqua/20 text-sm font-semibold text-aqua" aria-label="Profile menu">MO</button>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
