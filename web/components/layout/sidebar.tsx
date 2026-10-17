"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  ArrowLeftRight,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Building2,
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { User } from "@/types/domain";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  currentUser,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  // Navigation Items
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
    },
    {
      href: "/products",
      label: "Products",
      icon: Package,
    },
    {
      href: "/stock/movements",
      label: "Stock Movements",
      icon: ArrowLeftRight,
    },
    {
      href: "/purchase-orders",
      label: "Purchase Orders",
      icon: ClipboardList,
      ownerOnly: true,
    },
    {
      href: "/forecast",
      label: "Demand Forecast",
      icon: TrendingUp,
    },
    {
      href: "/alerts",
      label: "Stock Alerts",
      icon: AlertTriangle,
    },
    {
      href: "/suppliers",
      label: "Suppliers",
      icon: Building2,
      ownerOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.ownerOnly || can(currentUser, "view_purchase_orders")
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-card text-card-foreground">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M3 12h5l2-3 3 6 2-3h6" />
                <path d="M3 18h18" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-tight">
                ShelfSense
              </span>
              <span className="text-[11px] text-muted-foreground leading-none">
                Pharmacy & Retail
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors select-none",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-border">
        {currentUser && (
          <div className="p-2 rounded-lg bg-muted/40 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold text-foreground truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {currentUser.role === "OWNER" ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                      Owner
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                      Staff
                    </>
                  )}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border fixed inset-y-0 left-0 z-30 bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in-0"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl transform transition-transform duration-200 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
