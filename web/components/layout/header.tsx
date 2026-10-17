import * as React from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserCheck,
  Loader2,
} from "lucide-react";
import { User } from "@/types/domain";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenQuickSearch: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function Header({
  onOpenMobileMenu,
  onOpenQuickSearch,
  currentUser,
  onLogout,
  isLoggingOut = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click or Escape key
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const user = currentUser || {
    id: "usr-demo",
    name: "Elena Rostova",
    email: "elena.rostova@cornercare.com",
    role: "OWNER" as const,
  };

  const initials = (user.name || user.email || "ER")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isDark = theme === "dark";
  const isOwner = user.role === "OWNER";

  const handleLogoutClick = () => {
    setMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 right-0 left-0 md:left-64 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 px-4 md:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Location / Retail Live Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
          <span>Corner Care Retail • Live</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Search Input Trigger */}
        <button
          onClick={onOpenQuickSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search inventory...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono text-[10px] text-slate-400 border border-slate-200 dark:border-slate-600 shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {mounted && isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() =>
            toast.info("Automated Shift Audit", {
              description:
                "Terminal POS-01 inventory reconciliation verified. All ledger balances in sync.",
            })
          }
          aria-label="View notifications"
          className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Pill & Interactive Menu */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-700" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open user menu"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none capitalize">
                {(user.role || "owner").toLowerCase()}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                menuOpen ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
              }`}
            />
          </button>

          {/* User Menu Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                      isOwner
                        ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isOwner ? (
                      <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-slate-500" />
                    )}
                    {isOwner ? "Owner (Full Admin)" : "Staff Member"}
                  </span>
                </div>
              </div>

              {/* Action items: Logout */}
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isLoggingOut}
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50 text-left cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
