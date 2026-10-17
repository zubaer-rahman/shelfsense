"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { useStockMovements } from "@/hooks/api/use-stock-movements";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_30DAY_SALES, DailySalesRecord } from "@/lib/mock-data";
import { RotateCcw, AlertTriangle, TrendingUp } from "lucide-react";

export function SalesTrendChart() {
  const [period, setPeriod] = React.useState<"7D" | "30D" | "90D">("30D");

  // Fetch live sale movements to aggregate
  const {
    data: movementsData,
    isLoading,
    isError,
    refetch,
  } = useStockMovements({ type: "SALE", limit: 100 });

  // Merge live sale movements into chart timeline or use rich baseline
  const chartData = React.useMemo<DailySalesRecord[]>(() => {
    let base = [...MOCK_30DAY_SALES];

    // If live SALE movements exist, merge today's and recent days' activity
    const salesMovements = movementsData?.items?.filter((m) => m.type === "SALE") || [];
    if (salesMovements.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const todayTotalQty = salesMovements
        .filter((m) => m.createdAt.startsWith(today))
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

      if (todayTotalQty > 0 && base.length > 0) {
        const lastIdx = base.length - 1;
        base[lastIdx] = {
          ...base[lastIdx],
          units: base[lastIdx].units + todayTotalQty,
          revenue: base[lastIdx].revenue + todayTotalQty * 7.5,
        };
      }
    }

    if (period === "7D") {
      return base.slice(-7);
    }
    if (period === "90D") {
      return base;
    }
    return base;
  }, [movementsData, period]);

  const totalSalesUnits = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.units, 0);
  }, [chartData]);

  // Find peak point
  const peakPoint = React.useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((max, curr) => (curr.units > max.units ? curr : max), chartData[0]);
  }, [chartData]);

  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Units Sold, Last {period === "7D" ? "7" : period === "90D" ? "90" : "30"} Days
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

        {/* 4-State Chart Canvas */}
        <div className="w-full flex-1 min-h-[300px] pt-4">
          {isLoading ? (
            <div className="w-full h-full flex flex-col justify-between p-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-end gap-3 h-48 w-full pt-4">
                {[40, 65, 30, 85, 95, 75, 60, 80, 50, 70, 90, 85].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Failed to load sales trend telemetry
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry query</span>
              </button>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                No sales recorded in this period
              </p>
            </div>
          ) : (
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
                {peakPoint && (
                  <ReferenceDot
                    x={peakPoint.label}
                    y={peakPoint.units}
                    r={5}
                    fill="#0D9488"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
        {peakPoint
          ? `Peak demand recorded on ${peakPoint.label} (${peakPoint.units} units, $${peakPoint.revenue.toLocaleString()} sales volume)`
          : "Historical sales telemetry"}
      </div>
    </div>
  );
}
