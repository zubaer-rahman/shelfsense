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
  X,
  LogOut,
  ShieldCheck,
  UserCheck,
  Truck,
} from "lucide-react";
import { User } from "@/types/domain";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onSwitchRole?: () => void;
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  currentUser,
  onLogout,
  onSwitchRole,
}: SidebarProps) {
  const pathname = usePathname();

  const user = currentUser || {
    id: "usr-demo",
    name: "Elena Rostova",
    email: "elena.rostova@cornercare.com",
    role: "OWNER" as const,
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      href: "/products",
      label: "Products",
      icon: <Package className="w-5 h-5" />,
    },
    {
      href: "/suppliers",
      label: "Suppliers",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      href: "/stock/movements",
      label: "Stock Movements",
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      href: "/purchase-orders",
      label: "Purchase Orders",
      icon: <ClipboardList className="w-5 h-5" />,
      ownerOnly: true,
    },
    {
      href: "/forecast",
      label: "Forecast",
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const initials = (user.name || user.email || "ER")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isOwner = user.role === "OWNER";

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
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
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                ShelfSense
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                Retail inventory
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.ownerOnly && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Owner
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile card at bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role badge & quick role switch */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                isOwner
                  ? "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {isOwner ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <UserCheck className="w-3 h-3" />
              )}
              {isOwner ? "Owner" : "Staff"}
            </span>

            {onSwitchRole && (
              <button
                onClick={onSwitchRole}
                className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                Switch to {isOwner ? "Staff" : "Owner"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-30">
        {navContent}
      </aside>

      {/* Mobile Slide-over backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Mobile Slide-over drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </div>
    </>
  );
}
