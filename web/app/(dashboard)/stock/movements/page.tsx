"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/api/use-products";
import { useStockMovements } from "@/hooks/api/use-stock-movements";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { RecordMovementCard } from "@/components/features/stock/record-movement-card";
import { MovementHistoryTable } from "@/components/features/stock/movement-history-table";
import { MovementType } from "@/types/domain";
import { Package, CheckCircle2 } from "lucide-react";

function StockMovementsContent() {
  const searchParams = useSearchParams();

  // Read URL query params into component state to avoid full route refreshes and jumping
  const [page, setPage] = React.useState(() =>
    Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  );
  const [typeFilter, setTypeFilter] = React.useState<MovementType | "ALL">(
    () => (searchParams.get("type") || "ALL") as MovementType | "ALL"
  );
  const [productFilter, setProductFilter] = React.useState<string>(
    () => searchParams.get("productId") || "ALL"
  );

  // Sync state if URL changes externally (e.g. browser back/forward buttons)
  React.useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const t = (searchParams.get("type") || "ALL") as MovementType | "ALL";
    const prod = searchParams.get("productId") || "ALL";

    setPage((curr) => (curr !== p ? p : curr));
    setTypeFilter((curr) => (curr !== t ? t : curr));
    setProductFilter((curr) => (curr !== prod ? prod : curr));
  }, [searchParams]);

  const { user: currentUser } = useCurrentUser();

  // Products query to feed dropdowns and statistics
  const { data: productsData, refetch: refetchProducts } = useProducts({
    limit: 100,
  });
  const products = productsData?.data || productsData?.items || [];

  // Stock movements query with pagination and filters
  const {
    data: movementsData,
    isLoading,
    isError,
    error,
    refetch: refetchMovements,
  } = useStockMovements({
    page,
    limit: 10,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    productId: productFilter !== "ALL" ? productFilter : undefined,
  });

  const movements = movementsData?.data || movementsData?.items || [];
  const totalPages = movementsData?.totalPages || 1;
  const totalRecords = movementsData?.total || 0;

  // URL state update helper that preserves scroll position and prevents page reloading
  const updateUrl = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams.toString()
    );
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === null || val === "" || val === "ALL") {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    }
    const query = next.toString();
    const targetUrl = query ? `/stock/movements?${query}` : `/stock/movements`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  const handleTypeFilterChange = (newType: MovementType | "ALL") => {
    setTypeFilter(newType);
    setPage(1);
    updateUrl({ type: newType, page: 1 });
  };

  const handleProductFilterChange = (newProductId: string) => {
    setProductFilter(newProductId);
    setPage(1);
    updateUrl({ productId: newProductId, page: 1 });
  };

  const handleMovementRecorded = () => {
    refetchProducts();
    refetchMovements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <span>Ledger & Store Operations</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">Terminal POS-01</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Stock Movements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Record real-time transactions, manual stock adjustments, and view complete audit trail across store inventory.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Active SKUs</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {products.length} Products
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Verified Movements</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {totalRecords} Logged
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Record Movement Card */}
      <RecordMovementCard
        products={products}
        currentUser={currentUser}
        onMovementRecorded={handleMovementRecorded}
      />

      {/* BOTTOM SECTION: Movement History Table */}
      <MovementHistoryTable
        movements={movements}
        products={products}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetchMovements}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        productFilter={productFilter}
        onProductFilterChange={handleProductFilterChange}
      />
    </div>
  );
}

export default function StockMovementsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <StockMovementsContent />
    </Suspense>
  );
}
