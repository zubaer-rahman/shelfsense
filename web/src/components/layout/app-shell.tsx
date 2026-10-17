"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QuickSearchDialog } from "@/components/layout/quick-search-dialog";
import { User } from "@/types/domain";

interface AppShellProps {
  children: React.ReactNode;
  currentUser?: User | null;
  onLogout?: () => void;
}

export function AppShell({
  children,
  currentUser = {
    id: "usr-demo",
    name: "Dr. Alex Vance",
    email: "alex@cornercare.com",
    role: "OWNER",
  },
  onLogout,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = React.useState(false);

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
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
          currentUser={currentUser}
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
