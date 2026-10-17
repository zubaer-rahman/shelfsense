"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { can } from "@/lib/permissions";
import {
  Package,
  AlertTriangle,
  Clock,
  AlertOctagon,
  Truck,
  TrendingUp,
  PlusCircle,
  ReceiptText,
  ChevronRight,
  ShoppingBag,
  Percent,
  Trash2,
} from "lucide-react";
import { DashboardKpiCards } from "@/components/features/dashboard/dashboard-kpi-cards";
import { AlertTriagePanels } from "@/components/features/dashboard/alert-triage-panels";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { MOCK_30DAY_SALES, INITIAL_RECENT_MOVEMENTS } from "@/lib/mock-data";
import { toast } from "sonner";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [period, setPeriod] = React.useState<"7D" | "30D" | "90D">("30D");

  const isOwner = user?.role === "OWNER";

  // Adjust chart data based on period
  let chartData = MOCK_30DAY_SALES;
  if (period === "7D") {
    chartData = MOCK_30DAY_SALES.slice(-7);
  } else if (period === "90D") {
    chartData = MOCK_30DAY_SALES;
  }

  const totalSalesUnits = chartData.reduce((acc, curr) => acc + curr.units, 0);


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

      {/* 5 KPI Stat Cards */}
      <DashboardKpiCards />

      {/* Row 2: Two-column area (30-day Chart + Recent Movements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Units Sold Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Units Sold, Last 30 Days
                </h2>
                <span className="w-2 h-2 rounded-full bg-teal-600" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                  {totalSalesUnits.toLocaleString()} units total
                </span>{" "}
                • <span className="text-teal-600 dark:text-teal-400 font-medium">+8.4%</span> vs prev period
              </p>
            </div>

            {/* Period Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              {(["7D", "30D", "90D"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    period === p
                      ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-[260px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(val, i) => (i % 6 === 0 || i === chartData.length - 1 ? val : "")}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  domain={[80, 200]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-750">
                          <span className="text-slate-400 block font-medium">
                            {data.label} ({data.dateStr})
                          </span>
                          <div className="font-semibold text-teal-300 mt-0.5 flex items-center gap-2">
                            <span>{data.units} units sold</span>
                            <span className="text-slate-400 font-normal">(${data.revenue})</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="units"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                />
                {/* Highlight Peak at Day 24 matching mockup */}
                <ReferenceDot
                  x="Day 24"
                  y={184}
                  r={5}
                  fill="#0D9488"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
            Peak demand recorded on Day 24 (184 units, $1,290 sales volume)
          </div>
        </div>

        {/* Right: Recent Movements (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Recent Movements
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live store audit ledger</p>
              </div>
              <Link
                href="/stock/movements"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-0.5"
              >
                <span>View all (8)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {INITIAL_RECENT_MOVEMENTS.slice(0, 7).map((mov) => {
                let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (mov.type === "Stock In") {
                  badgeClass = "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400";
                } else if (mov.type === "Adjustment") {
                  badgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
                }

                const isNegative = mov.signedQuantity < 0;

                return (
                  <div
                    key={mov.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {mov.productName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className={`px-1.5 py-0.2 rounded font-medium ${badgeClass}`}>
                          {mov.type}
                        </span>
                        <span>{mov.loggedBy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold tabular-nums ${
                          isNegative ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400"
                        }`}
                      >
                        {mov.signedQuantity > 0 ? `+${mov.signedQuantity}` : mov.signedQuantity}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {mov.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/stock/movements"
            className="mt-3 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Record New Stock Movement</span>
          </Link>
        </div>
      </div>

      {/* Row 3: Three Alert Triage Cards Side-by-Side */}
      <AlertTriagePanels />
    </div>
  );
}
