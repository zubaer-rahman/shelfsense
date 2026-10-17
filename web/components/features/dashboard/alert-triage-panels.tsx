"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useLowStockAlerts, useNearExpiryAlerts, useExpiredAlerts } from "@/hooks/api/use-alerts";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Percent, Trash2, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function AlertTriagePanels() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isOwner = user?.role === "OWNER";

  const [nearExpiryDays, setNearExpiryDays] = React.useState<7 | 14 | 30>(30);

  // Queries
  const {
    data: lowStockData,
    isLoading: isLowStockLoading,
    isError: isLowStockError,
    refetch: refetchLowStock,
  } = useLowStockAlerts({ limit: 5 });

  const {
    data: nearExpiryData,
    isLoading: isNearExpiryLoading,
    isError: isNearExpiryError,
    refetch: refetchNearExpiry,
  } = useNearExpiryAlerts({ days: nearExpiryDays, limit: 5 });

  const {
    data: expiredData,
    isLoading: isExpiredLoading,
    isError: isExpiredError,
    refetch: refetchExpired,
  } = useExpiredAlerts({ limit: 5 });

  const lowStockItems = lowStockData?.items || [];
  const lowStockTotal = lowStockData?.total ?? 0;

  const nearExpiryItems = nearExpiryData?.items || [];
  const nearExpiryTotal = nearExpiryData?.total ?? 0;

  const expiredItems = expiredData?.items || [];
  const expiredTotal = expiredData?.total ?? 0;

  const handleBatchReorder = () => {
    if (!isOwner) {
      toast.warning("Owner Permission Required", {
        description: "Only Store Owners can authorize and create Purchase Orders.",
      });
      return;
    }
    router.push("/purchase-orders");
    toast.info("Batch Reorder Queue", {
      description: `${lowStockTotal} low-stock items queued for supplier restock.`,
    });
  };

  const handleClearance = () => {
    toast.success("Clearance Promotion Applied", {
      description: `${nearExpiryTotal} near-expiry SKU batches tagged with 25% promotional discount.`,
    });
  };

  const handleDisposeAll = () => {
    if (!isOwner) {
      toast.warning("Owner Permission Required", {
        description: "Only Store Owners can authorize inventory disposal manifests.",
      });
      return;
    }
    toast.success("Disposal Manifest Authorized", {
      description: `${expiredTotal} expired batches scheduled for certified retail waste disposal.`,
    });
  };

  const getDaysFromNow = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    const target = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.round((target - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Low Stock Panel (Amber) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Low Stock
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 tabular-nums">
                {lowStockTotal}
              </span>
            </div>
            <Link
              href="/products?status=LOW_STOCK"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-3">
            {isLowStockLoading ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3.5 w-14" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : isLowStockError ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-6 h-6 text-amber-500 mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load low stock alerts</p>
                <button
                  onClick={() => refetchLowStock()}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-8 h-8 text-teal-500 mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Stock levels healthy
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                  No items currently breach their reorder thresholds.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockItems.slice(0, 5).map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round((item.quantity / Math.max(1, item.reorderLevel)) * 100)
                  );

                  return (
                    <div key={item.id} className="py-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">
                          {item.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                          {item.quantity} left
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Threshold: {item.reorderLevel} min</span>
                        <span className="tabular-nums">{percent}% capacity</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleBatchReorder}
          className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Create batch reorder ({lowStockTotal} items)</span>
        </button>
      </div>

      {/* 2. Near Expiry Panel (Amber) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Near Expiry
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 tabular-nums">
                {nearExpiryTotal}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Horizon Switcher */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-semibold">
                {([7, 14, 30] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setNearExpiryDays(d)}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                      nearExpiryDays === d
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <Link
                href={`/products?status=NEAR_EXPIRY&days=${nearExpiryDays}`}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="mt-3">
            {isNearExpiryLoading ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                ))}
              </div>
            ) : isNearExpiryError ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-6 h-6 text-amber-500 mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load near expiry alerts</p>
                <button
                  onClick={() => refetchNearExpiry()}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : nearExpiryItems.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-8 h-8 text-teal-500 mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Shelf life optimal
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                  No products expiring within the next {nearExpiryDays} days.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {nearExpiryItems.slice(0, 5).map((item) => {
                  const daysLeft = Math.max(0, getDaysFromNow(item.expiryDate));
                  const dateStr = item.expiryDate ? item.expiryDate.split("T")[0] : "—";

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          SKU {item.sku} • {item.quantity} units
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          In {daysLeft} days
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* 3. Expired Batches Panel (Rose) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Expired Batches
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 tabular-nums">
                {expiredTotal}
              </span>
            </div>
            <Link
              href="/products?status=EXPIRED"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-3">
            {isExpiredLoading ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                ))}
              </div>
            ) : isExpiredError ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-6 h-6 text-rose-500 mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load expired alerts</p>
                <button
                  onClick={() => refetchExpired()}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : expiredItems.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-8 h-8 text-teal-500 mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Zero expired stock
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                  All catalog batches are fully compliant with shelf-life policies.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {expiredItems.slice(0, 5).map((item) => {
                  const daysAgo = Math.abs(getDaysFromNow(item.expiryDate));
                  const dateStr = item.expiryDate ? item.expiryDate.split("T")[0] : "—";

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          SKU {item.sku} • {item.quantity} units
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {daysAgo} days ago
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 tabular-nums">
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDisposeAll}
          className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Dispose all expired batches ({expiredTotal} items)</span>
        </button>
      </div>
    </div>
  );
}
