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

  const handleBatchReorder = () => {
    if (!isOwner) {
      toast.warning("Owner Permission Required", {
        description: "Only Owners can create Purchase Orders. Switch to Owner role to proceed.",
      });
      return;
    }
    router.push("/purchase-orders");
    toast.info("Batch Reorder Queue", {
      description: "10 low-stock products queued for supplier restocking.",
    });
  };

  const handleClearance = () => {
    toast.success("Clearance Discount Applied", {
      description: "7 near-expiry SKU batches tagged with 25% clearance promo tag.",
    });
  };

  const handleDisposeAll = () => {
    if (!isOwner) {
      toast.warning("Owner Permission Required", {
        description: "Only Owners can authorize stock write-offs and disposals.",
      });
      return;
    }
    toast.success("Disposal Manifest Authorized", {
      description: "6 expired batches scheduled for hazardous medical waste incineration.",
    });
  };

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

      {/* 5 KPI Stat Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Active Products */}
        <Link
          href="/products"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-teal-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Active Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              24
            </div>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1 font-medium">
              <span>↑</span>
              <span>100% catalog active</span>
            </p>
          </div>
        </Link>

        {/* 2. Low Stock */}
        <Link
          href="/products?status=LOW_STOCK"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Low Stock Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              10
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Needs reordering</span>
            </p>
          </div>
        </Link>

        {/* 3. Near Expiry */}
        <Link
          href="/products"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Near Expiry (30d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              7
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Expiring in ≤ 30 days</span>
            </p>
          </div>
        </Link>

        {/* 4. Expired */}
        <Link
          href="/products"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Expired
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              6
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Immediate disposal req.</span>
            </p>
          </div>
        </Link>

        {/* 5. Open POs */}
        <div
          onClick={() => {
            if (isOwner) router.push("/purchase-orders");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-blue-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Open POs
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              2
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                $2,460.50
              </span>
              <span>pending arrival</span>
            </p>
          </div>
        </div>
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Low Stock (Amber) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Low Stock
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 tabular-nums">
                  10
                </span>
              </div>
              <Link
                href="/products?status=LOW_STOCK"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Napa Extra 500mg", stock: 14, min: 50, percent: 28 },
                { name: "Azithromycin 500mg", stock: 8, min: 20, percent: 40 },
                { name: "Normal Saline 0.9% 500ml", stock: 18, min: 40, percent: 45 },
                { name: "Oral Rehydration Salts (ORS)", stock: 35, min: 60, percent: 58 },
                { name: "Omeprazole 20mg Delayed", stock: 22, min: 30, percent: 73 },
              ].map((item) => (
                <div key={item.name} className="py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 tabular-nums">
                      {item.stock} left
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Threshold: {item.min} min</span>
                    <span className="tabular-nums">{item.percent}% capacity</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleBatchReorder}
            className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Create batch reorder (10 items)</span>
          </button>
        </div>

        {/* Card 2: Near Expiry (Amber) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Near Expiry (≤30d)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 tabular-nums">
                  7
                </span>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Ciprofloxacin Eye Drops 5ml", batch: "CP-440", stock: 18, days: 14, date: "2024-11-18" },
                { name: "Insulin Glargine 100 IU/ml", batch: "IN-882", stock: 12, days: 21, date: "2024-11-25" },
                { name: "Amoxicillin Clavulanate Syrup", batch: "AC-102", stock: 26, days: 24, date: "2024-11-28" },
                { name: "Montelukast 10mg Chewable", batch: "MO-552", stock: 95, days: 28, date: "2024-12-02" },
                { name: "Tetanus Toxoid Vaccine 0.5ml", batch: "TT-091", stock: 40, days: 30, date: "2024-12-04" },
              ].map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      Batch {item.batch} • {item.stock} units
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      In {item.days} days
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleClearance}
            className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Mark for clearance discount</span>
          </button>
        </div>

        {/* Card 3: Expired Batches (Rose) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Expired Batches
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 tabular-nums">
                  6
                </span>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Dextrose 5% in Water 500ml", batch: "DX-990", stock: 8, daysAgo: 4, date: "2024-10-31" },
                { name: "Salbutamol Inhaler 100mcg", batch: "SB-210", stock: 14, daysAgo: 10, date: "2024-10-25" },
                { name: "Metronidazole 400mg Tablets", batch: "MT-441", stock: 32, daysAgo: 15, date: "2024-10-20" },
                { name: "Diclofenac Sodium 50mg", batch: "DS-771", stock: 20, daysAgo: 22, date: "2024-10-13" },
                { name: "Ranitidine 150mg Tablets", batch: "RN-004", stock: 45, daysAgo: 35, date: "2024-09-30" },
              ].map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      Batch {item.batch} • {item.stock} units
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {item.daysAgo} days ago
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 tabular-nums">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDisposeAll}
            className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Dispose all expired batches (6 items)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
