"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import {
  TrendingUp,
  PlusCircle,
  ReceiptText,
} from "lucide-react";
import { DashboardKpiCards } from "@/components/features/dashboard/dashboard-kpi-cards";
import { AlertTriagePanels } from "@/components/features/dashboard/alert-triage-panels";
import { SalesTrendChart } from "@/components/features/dashboard/sales-trend-chart";
import { RecentMovementsCard } from "@/components/features/dashboard/recent-movements-card";
import { toast } from "sonner";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isOwner = user?.role === "OWNER";

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Bar / Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Store Operations
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              Shift active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry, shelf threshold warnings, and immediate stock actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/forecast"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Open forecast</span>
          </Link>

          <button
            onClick={() => {
              if (!isOwner) {
                toast.warning("Owner Permission Required", {
                  description: "Purchase orders are restricted to Owner role.",
                });
                return;
              }
              router.push("/purchase-orders");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>New purchase order</span>
          </button>

          <Link
            href="/stock/movements"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Record sale</span>
          </Link>
        </div>
      </div>

      {/* Row 1: 5 KPI Stat Cards */}
      <DashboardKpiCards />

      {/* Row 2: Two-column area (Sales Trend Chart + Recent Movements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col">
          <SalesTrendChart />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <RecentMovementsCard />
        </div>
      </div>

      {/* Row 3: Three Alert Triage Cards Side-by-Side */}
      <AlertTriagePanels />
    </div>
  );
}
