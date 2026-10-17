"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QuickSearchDialog } from "@/components/layout/quick-search-dialog";
import { useCurrentUser } from "@/hooks/api/use-current-user";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout, isLoggingOut } = useCurrentUser();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = React.useState(false);

  const effectiveUser = user || {
    id: "usr-demo",
    name: "Elena Rostova",
    email: "elena.rostova@cornercare.com",
    role: "OWNER" as const,
  };

  // Global ⌘K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        currentUser={effectiveUser}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
          currentUser={effectiveUser}
          onLogout={logout}
          isLoggingOut={isLoggingOut}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Search Dialog (⌘K) */}
      <QuickSearchDialog
        open={quickSearchOpen}
        onOpenChange={setQuickSearchOpen}
      />
    </div>
  );
}
