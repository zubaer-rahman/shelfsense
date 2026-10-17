"use client";

import * as React from "react";
import Link from "next/link";
import { useStockMovements } from "@/hooks/api/use-stock-movements";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ShoppingBag, RotateCcw, AlertTriangle, Inbox } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export function RecentMovementsCard() {
  const { data, isLoading, isError, refetch } = useStockMovements({ limit: 7 });

  const movements = data?.items || [];
  const totalCount = data?.total ?? movements.length;

  const formatTimestamp = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return formatDistanceToNow(parsed, { addSuffix: true });
    } catch {
      return dateStr.split("T")[0];
    }
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
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
            <span>View all ({totalCount})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-2">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 py-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-3.5 w-10 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-6 h-6 text-amber-500 mb-1.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load recent movements</p>
              <button
                onClick={() => refetch()}
                className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Inbox className="w-8 h-8 text-slate-400 mb-2 opacity-70" />
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                No recent movements
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                Sales, deliveries, and adjustments will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.slice(0, 7).map((mov) => {
                let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                let typeLabel = "Sale";

                if (mov.type === "STOCK_IN") {
                  badgeClass = "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400";
                  typeLabel = "Stock In";
                } else if (mov.type === "ADJUSTMENT") {
                  badgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
                  typeLabel = "Adjustment";
                }

                // Signed quantity logic:
                // SALE is negative (-qty), STOCK_IN is positive (+qty), ADJUSTMENT has its sign
                const signedQty = mov.type === "SALE" ? -Math.abs(mov.quantity) : mov.quantity;
                const isNegative = signedQty < 0;
                const productName = mov.product?.name || `Product #${mov.productId.slice(0, 8)}`;
                const operatorName = mov.user?.name || (mov.user?.role === "OWNER" ? "Store Owner" : "Shift Staff");

                return (
                  <div
                    key={mov.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {productName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className={`px-1.5 py-0.2 rounded font-medium ${badgeClass}`}>
                          {typeLabel}
                        </span>
                        <span>{operatorName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold tabular-nums ${
                          isNegative ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400"
                        }`}
                      >
                        {signedQty > 0 ? `+${signedQty}` : signedQty}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {formatTimestamp(mov.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  );
}
