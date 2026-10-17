"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ForecastResponse, useCreatePOFromForecast } from "@/hooks/api/use-forecast";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Package,
  Clock,
  ShieldCheck,
  Calculator,
  PlusCircle,
  Building,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types/domain";

interface ForecastBreakdownCardProps {
  forecast: ForecastResponse;
  currentUser: User | null;
  strategyParam?: "moving_average" | "linear_regression" | "naive";
  windowParam?: number;
}

export function ForecastBreakdownCard({
  forecast,
  currentUser,
  strategyParam,
  windowParam,
}: ForecastBreakdownCardProps) {
  const router = useRouter();
  const createPOMutation = useCreatePOFromForecast();

  const isOwner = currentUser?.role === "OWNER";
  const {
    product,
    strategy,
    window,
    expectedDailyDemand,
    currentStock,
    leadTimeDays,
    safetyBuffer,
    suggestedReorderQuantity,
  } = forecast;

  const grossDemand = expectedDailyDemand * leadTimeDays;
  const targetBufferStock = grossDemand + safetyBuffer;
  const rawReorderNeeded = targetBufferStock - currentStock;

  const handleGeneratePO = async () => {
    if (!isOwner) {
      toast.warning("Owner Role Required", {
        description: "Only store owners can generate Purchase Orders from forecast suggestions.",
      });
      return;
    }

    try {
      const po = await createPOMutation.mutateAsync({
        productId: product.id,
        params: {
          strategy: strategyParam,
          window: windowParam,
        },
      });

      toast.success("Purchase Order Created", {
        description: `Draft order created for ${suggestedReorderQuantity} units of ${product.name}.`,
      });

      router.push(`/purchase-orders`);
    } catch (err: any) {
      toast.error("Failed to Generate Order", {
        description: err.message || "An error occurred while creating order.",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col gap-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Demand & Reorder Recommendation
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Computed via <strong>{strategy}</strong> ({window}-day window)
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold self-start sm:self-auto">
          <span>Target Supplier:</span>
          <span className="text-teal-600 dark:text-teal-400">{product.supplier.name}</span>
        </div>
      </div>

      {/* 4 Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
            Expected Daily Rate
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {expectedDailyDemand}
            <span className="text-xs font-normal text-muted-foreground ml-1">units/day</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
            Lead Time
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {leadTimeDays}
            <span className="text-xs font-normal text-muted-foreground ml-1">days delivery</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
            Safety Stock Buffer
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {safetyBuffer}
            <span className="text-xs font-normal text-muted-foreground ml-1">units</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
            Current On-Shelf
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {currentStock}
            <span className="text-xs font-normal text-muted-foreground ml-1">units</span>
          </div>
        </div>
      </div>

      {/* Formula Breakdown Walkthrough Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Reorder Formula Breakdown:
          </span>
          <code className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-800 dark:text-slate-200">
            ceil(ExpectedDailyDemand × LeadTime + SafetyBuffer − CurrentStock)
          </code>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1.5 tabular-nums text-slate-800 dark:text-slate-200">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected Demand in Lead Window:</span>
            <span>{expectedDailyDemand} × {leadTimeDays} = {grossDemand.toFixed(2)} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add Safety Stock Buffer:</span>
            <span>{grossDemand.toFixed(2)} + {safetyBuffer} = {targetBufferStock.toFixed(2)} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deduct Current Inventory:</span>
            <span>{targetBufferStock.toFixed(2)} − {currentStock} = {rawReorderNeeded.toFixed(2)} units</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-teal-600 dark:text-teal-400">
            <span>Suggested Order Quantity:</span>
            <span>{suggestedReorderQuantity} units (rounded up)</span>
          </div>
        </div>
      </div>

      {/* Recommendation Banner & Action CTA */}
      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wide block">
            Suggested Reorder Recommendation
          </span>
          <div className="text-2xl font-bold text-teal-900 dark:text-teal-100 mt-0.5 tabular-nums">
            {suggestedReorderQuantity > 0 ? (
              <>Order {suggestedReorderQuantity} Units</>
            ) : (
              <>Healthy Stock — No Reorder Required</>
            )}
          </div>
          <p className="text-xs text-teal-700 dark:text-teal-400 mt-1">
            {suggestedReorderQuantity > 0
              ? `Estimated procurement cost: $${(suggestedReorderQuantity * (product.unitPrice || 1.0)).toFixed(2)} from ${product.supplier.name}.`
              : "On-shelf inventory covers forecasted demand and safety buffer for the delivery lead window."}
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleGeneratePO}
          disabled={suggestedReorderQuantity <= 0 || createPOMutation.isPending}
          className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shrink-0 cursor-pointer h-10 px-4"
        >
          <PlusCircle className="w-4 h-4" />
          <span>
            {createPOMutation.isPending ? "Generating Order..." : "Create Purchase Order Draft"}
          </span>
        </Button>
      </div>
    </div>
  );
}
