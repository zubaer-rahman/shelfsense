"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QuickSearchDialog } from "@/components/layout/quick-search-dialog";
import { DevToolbar } from "@/components/layout/dev-toolbar";
import { useCurrentUser } from "@/hooks/api/use-current-user";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useCurrentUser();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = React.useState(false);

  // Local simulated role for testing live
  const [simulatedRole, setSimulatedRole] = React.useState<"OWNER" | "STAFF">("OWNER");

  // Sync simulatedRole with real user role if loaded
  React.useEffect(() => {
    if (user?.role) {
      setSimulatedRole(user.role);
    }
  }, [user?.role]);

  const effectiveUser = user ? { ...user, role: simulatedRole } : {
    id: "usr-demo",
    name: "Elena Rostova",
    email: "elena.rostova@cornercare.com",
    role: simulatedRole,
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
        onSwitchRole={() =>
          setSimulatedRole((prev) => (prev === "OWNER" ? "STAFF" : "OWNER"))
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
          currentUser={effectiveUser}
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

      {/* Floating Developer Simulation Toolbar */}
      <DevToolbar
        role={simulatedRole}
        onRoleChange={setSimulatedRole}
      />
    </div>
  );
}
