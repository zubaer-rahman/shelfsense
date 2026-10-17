"use client";

import * as React from "react";
import { Menu, Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { User } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenQuickSearch: () => void;
  currentUser?: User | null;
}

export function Header({
  onOpenMobileMenu,
  onOpenQuickSearch,
  currentUser,
}: HeaderProps) {
  return (
    <header className="sticky top-0 right-0 left-0 md:left-64 h-16 bg-card/95 backdrop-blur-md border-b border-border z-20 px-4 md:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Location / Dispensary Live Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Corner Care Pharmacy • Live</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search Trigger */}
        <button
          onClick={onOpenQuickSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs hover:border-border/80 hover:bg-muted transition-colors cursor-pointer select-none"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search catalog...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-card font-mono text-[10px] text-muted-foreground border border-border shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenQuickSearch}
          className="sm:hidden"
          aria-label="Quick search"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Notifications Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            toast.info("Automated Stock Audit", {
              description: "Terminal POS-01 reconciliation verified. Ledger balances in sync.",
            })
          }
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
        </Button>

        {/* Dark Mode Theme Toggle */}
        <ThemeToggle />

        {/* User Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
              {(currentUser.name || currentUser.email || "US").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {currentUser.name || currentUser.email || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none capitalize">
                {(currentUser.role || "staff").toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
