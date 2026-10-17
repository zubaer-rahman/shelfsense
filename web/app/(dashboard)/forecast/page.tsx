"use client";

import * as React from "react";
import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useProducts } from "@/hooks/api/use-products";
import { useProductForecast } from "@/hooks/api/use-forecast";
import { ForecastChart } from "@/components/features/forecast/forecast-chart";
import { ForecastBreakdownCard } from "@/components/features/forecast/forecast-breakdown-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TrendingUp, Package, SlidersHorizontal, ArrowRight, ShieldCheck } from "lucide-react";

function ForecastContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user: currentUser } = useCurrentUser();

  // Products query to feed selector
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const products = productsData?.data || productsData?.items || [];

  // Read URL query params
  const strategyParam = (searchParams.get("strategy") || "moving_average") as
    | "moving_average"
    | "linear_regression"
    | "naive";
  const windowParam = parseInt(searchParams.get("window") || "14", 10);
  const requestedProductId = searchParams.get("productId");

  const [selectedProductId, setSelectedProductId] = useState<string>(
    requestedProductId || products[0]?.id || ""
  );

  // Keep selected product in sync once products load
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(requestedProductId || products[0].id);
    }
  }, [products, requestedProductId, selectedProductId]);

  // URL state update helper
  const updateParams = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    }
    router.replace(`/forecast?${next.toString()}`);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    updateParams({ productId: prodId });
  };

  const handleStrategyChange = (st: "moving_average" | "linear_regression" | "naive") => {
    updateParams({ strategy: st });
  };

  const handleWindowChange = (w: number) => {
    updateParams({ window: w });
  };

  // Forecast query
  const {
    data: forecast,
    isLoading: forecastLoading,
    isError,
    error,
    refetch,
  } = useProductForecast(selectedProductId, {
    strategy: strategyParam,
    window: windowParam,
  });

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Demand Forecasting
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
              Restock Predictor
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Algorithmic demand projections, trendline modeling, and safety-stock reorder suggestions.
          </p>
        </div>
      </div>

      {/* Control Card: Target Product + Model Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors">
        {/* Product Picker */}
        <div className="flex-1 min-w-[260px] space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Target Catalog Item
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            disabled={products.length === 0}
            className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
          >
            {products.length === 0 ? (
              <option value="">No products available</option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock: {p.quantity} units | Reorder: {p.reorderLevel}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Strategy Switcher */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Forecasting Model
          </label>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            {(
              [
                { id: "moving_average", label: "Moving Average" },
                { id: "linear_regression", label: "Linear Regression" },
                { id: "naive", label: "Naive Baseline" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleStrategyChange(item.id)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  strategyParam === item.id
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Window Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Analysis Window
          </label>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            {[7, 14, 30].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleWindowChange(w)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  windowParam === w
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {w}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-State Handling */}
      {productsLoading || forecastLoading ? (
        <div className="space-y-6">
          <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Demand Calculation Error"
          message={error?.message || "Failed to calculate demand forecast for the selected product."}
          onRetry={refetch}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Catalog Products Available"
          description="Register products in the Product Catalog to calculate restock demand forecasts."
          actionText="Open Product Catalog"
          onAction={() => router.push("/products")}
        />
      ) : forecast ? (
        <div className="space-y-6">
          {/* Historical Demand Chart */}
          <ForecastChart
            data={forecast.dailySeries}
            expectedDemand={forecast.expectedDailyDemand}
            productName={forecast.product.name}
          />

          {/* Mathematical Breakdown & Reorder CTA */}
          <ForecastBreakdownCard
            forecast={forecast}
            currentUser={currentUser}
            strategyParam={strategyParam}
            windowParam={windowParam}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ForecastPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <ForecastContent />
    </Suspense>
  );
}
