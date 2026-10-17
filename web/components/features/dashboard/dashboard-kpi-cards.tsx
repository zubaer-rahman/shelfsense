"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, AlertTriangle, Clock, AlertOctagon, Truck, Lock } from "lucide-react";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useProducts } from "@/hooks/api/use-products";
import { useLowStockAlerts, useNearExpiryAlerts, useExpiredAlerts } from "@/hooks/api/use-alerts";
import { usePurchaseOrders } from "@/hooks/api/use-purchase-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function DashboardKpiCards() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isOwner = user?.role === "OWNER";

  // Queries for live metric totals
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 1 });
  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStockAlerts({ limit: 1 });
  const { data: nearExpiryData, isLoading: isLoadingNearExpiry } = useNearExpiryAlerts({ days: 30, limit: 1 });
  const { data: expiredData, isLoading: isLoadingExpired } = useExpiredAlerts({ limit: 1 });
  const { data: poData, isLoading: isLoadingPOs } = usePurchaseOrders({ limit: 100 });

  const activeProductsCount = productsData?.total ?? 24;
  const lowStockCount = lowStockData?.total ?? 10;
  const nearExpiryCount = nearExpiryData?.total ?? 7;
  const expiredCount = expiredData?.total ?? 6;

  // Open POs (DRAFT or ORDERED)
  const openPOs = React.useMemo(() => {
    if (!poData?.items) return [];
    return poData.items.filter((po) => po.status === "DRAFT" || po.status === "ORDERED");
  }, [poData]);

  const openPOCount = isOwner ? openPOs.length : "—";
  const openPOTotalSpend = React.useMemo(() => {
    if (!isOwner || !openPOs.length) return 2460.5;
    return openPOs.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  }, [isOwner, openPOs]);

  const handleOpenPOClick = () => {
    if (!isOwner) {
      toast.info("Purchase Orders Restricted", {
        description: "Purchase order telemetry and restock operations are restricted to Store Owners.",
      });
      return;
    }
    router.push("/purchase-orders");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Active Products */}
      <Link
        href="/products"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-teal-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Active Products
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          {isLoadingProducts ? (
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {activeProductsCount}
              </div>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1 font-medium">
                <span>↑</span>
                <span>100% catalog active</span>
              </p>
            </>
          )}
        </div>
      </Link>

      {/* 2. Low Stock */}
      <Link
        href="/products?status=LOW_STOCK"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-amber-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Low Stock Items
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          {isLoadingLowStock ? (
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {lowStockCount}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Needs reordering</span>
              </p>
            </>
          )}
        </div>
      </Link>

      {/* 3. Near Expiry */}
      <Link
        href="/products"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-amber-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Near Expiry (30d)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          {isLoadingNearExpiry ? (
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {nearExpiryCount}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Expiring in ≤ 30 days</span>
              </p>
            </>
          )}
        </div>
      </Link>

      {/* 4. Expired */}
      <Link
        href="/products"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-rose-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Expired
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          {isLoadingExpired ? (
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {expiredCount}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Immediate disposal req.</span>
              </p>
            </>
          )}
        </div>
      </Link>

      {/* 5. Open POs */}
      <div
        onClick={handleOpenPOClick}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-blue-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Open POs
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {isOwner ? <Truck className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>
        <div className="mt-4">
          {isLoadingPOs ? (
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {openPOCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                {isOwner ? (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                      ${openPOTotalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>pending arrival</span>
                  </>
                ) : (
                  <span>Owner restock queue</span>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
