"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Archive,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";
import { Product, MovementType, AdjustmentDirection, User } from "@/types/domain";
import { useRecordStockMovement } from "@/hooks/api/use-stock-movements";
import { toast } from "sonner";
import { can } from "@/lib/role-helpers";

interface RecordMovementCardProps {
  products: Product[];
  currentUser: User | null;
  onMovementRecorded?: () => void;
}

export function RecordMovementCard({
  products,
  currentUser,
  onMovementRecorded,
}: RecordMovementCardProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );
  const [movementType, setMovementType] = useState<MovementType>("SALE");
  const [adjustmentDirection, setAdjustmentDirection] =
    useState<AdjustmentDirection>("DECREASE");
  const [quantity, setQuantity] = useState<string>("5");
  const [note, setNote] = useState<string>("");

  const recordMutation = useRecordStockMovement();

  // If initial product id is empty but products loaded, select the first
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const parsedQty = Math.max(0, parseInt(quantity, 10) || 0);

  // Calculate live delta and projected balance
  let delta = 0;
  if (movementType === "SALE") {
    delta = -parsedQty;
  } else if (movementType === "STOCK_IN") {
    delta = parsedQty;
  } else {
    delta = adjustmentDirection === "INCREASE" ? parsedQty : -parsedQty;
  }

  const currentStock = selectedProduct ? selectedProduct.quantity : 0;
  const projectedBalance = currentStock + delta;
  const isInsufficientStock =
    (movementType === "SALE" ||
      (movementType === "ADJUSTMENT" && adjustmentDirection === "DECREASE")) &&
    parsedQty > currentStock;
  const isZeroQty = parsedQty <= 0;
  const isBlocked = isInsufficientStock || isZeroQty || !selectedProduct;

  const isOwner = currentUser?.role === "OWNER";

  const handleProtocolSelect = (type: MovementType) => {
    if (type !== "SALE" && !isOwner) {
      toast.warning("Owner Role Required", {
        description: `Only store owners can record ${
          type === "STOCK_IN" ? "Stock In receiving" : "Manual Adjustments"
        }.`,
      });
      return;
    }
    setMovementType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast.error("Transaction Blocked", {
        description: "Cannot record transaction that creates a negative inventory balance.",
      });
      return;
    }

    try {
      const res = await recordMutation.mutateAsync({
        productId: selectedProduct.id,
        type: movementType,
        quantity: parsedQty,
        direction: movementType === "ADJUSTMENT" ? adjustmentDirection : undefined,
        note: note.trim() || undefined,
      });

      toast.success("Stock Movement Recorded", {
        description: `${selectedProduct.name}: new on-shelf balance is ${res.currentStock} units.`,
      });

      setNote("");
      setQuantity("1");
      onMovementRecorded?.();
    } catch (err: any) {
      toast.error("Failed to Record Movement", {
        description: err.message || "An unexpected error occurred.",
      });
    }
  };

  const handleClear = () => {
    setQuantity("1");
    setNote("");
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-6 flex flex-col gap-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Record Movement
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Log sales outbound, inbound shipments, or verified physical stock adjustments
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
          <span>Audit Lock: Real-time syncing</span>
        </div>
      </div>

      {/* 1. Movement Protocol Segmented Bar */}
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
          1. Movement Protocol
        </label>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleProtocolSelect("SALE")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 justify-center ${
              movementType === "SALE"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Sale / Outbound</span>
          </button>

          <button
            type="button"
            onClick={() => handleProtocolSelect("STOCK_IN")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 justify-center ${
              movementType === "STOCK_IN"
                ? "bg-teal-600 text-white shadow-xs"
                : isOwner
                ? "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Stock In / Receiving</span>
            {!isOwner && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Owner
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleProtocolSelect("ADJUSTMENT")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 justify-center ${
              movementType === "ADJUSTMENT"
                ? "bg-teal-600 text-white shadow-xs"
                : isOwner
                ? "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Adjustment</span>
            {!isOwner && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Owner
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Form Inputs Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Picker, Direction (only for adjustment), Note (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Product Picker */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Product & SKU
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              {products.length === 0 ? (
                <option value="">No products available</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Current Stock: {p.quantity} units | Category: {p.category}
                  </option>
                ))
              )}
            </select>

            {selectedProduct && (
              <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Category: <strong>{selectedProduct.category}</strong>
                  {selectedProduct.expiryDate && (
                    <> • Exp: <strong>{selectedProduct.expiryDate.slice(0, 10)}</strong></>
                  )}
                </span>
                <span
                  className={`font-semibold ${
                    selectedProduct.quantity <= selectedProduct.reorderLevel
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-teal-600 dark:text-teal-400"
                  }`}
                >
                  Threshold: {selectedProduct.reorderLevel} units min
                </span>
              </div>
            )}
          </div>

          {/* Adjustment Direction Toggle - ONLY SHOWN FOR ADJUSTMENT */}
          {movementType === "ADJUSTMENT" && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adjustment Direction
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Required when reconciling physical shelf counts
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection("INCREASE")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    adjustmentDirection === "INCREASE"
                      ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <span>(+) Increase Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection("DECREASE")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                    adjustmentDirection === "DECREASE"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <span>(-) Decrease Stock</span>
                </button>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reference Note & Audit Reason
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Optional reference details
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Broken packaging during transit, register recount correction, checkout ref #4102..."
              rows={2}
              maxLength={255}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>
        </div>

        {/* Right Column: Quantity, Live Calculation & Insufficient Stock Warning (Col 5) */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Movement Quantity
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {movementType === "STOCK_IN" ||
                (movementType === "ADJUSTMENT" && adjustmentDirection === "INCREASE")
                  ? "Units to add"
                  : "Units to deduct"}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`w-full pl-4 pr-12 py-2 rounded-lg bg-white dark:bg-slate-900 border text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 transition-all ${
                  isInsufficientStock
                    ? "border-rose-500 ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "border-slate-300 dark:border-slate-700 focus:ring-teal-500/20 focus:border-teal-600"
                }`}
              />
              <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                UNITS
              </span>
            </div>
          </div>

          {/* Live Ledger Delta Preview Box */}
          <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
              Live Audit Vector
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Current On-Shelf</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {currentStock} units
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  delta < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-teal-600 dark:text-teal-400"
                }
              >
                {delta < 0 ? "Proposed Deduction" : "Proposed Inbound"}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  delta < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} units
              </span>
            </div>

            <div
              className={`pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between p-2 rounded ${
                isInsufficientStock
                  ? "bg-rose-50 dark:bg-rose-950/40"
                  : "bg-slate-50 dark:bg-slate-800/60"
              }`}
            >
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Projected Balance
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  isInsufficientStock
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {projectedBalance} units {isInsufficientStock && "(Deficit)"}
              </span>
            </div>
          </div>

          {/* Insufficient Stock Warning Callout */}
          {isInsufficientStock && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-800 dark:text-rose-300 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-snug">
                <strong className="block font-semibold">Insufficient Stock Warning</strong>
                Sale quantity ({parsedQty}) exceeds current stock ({currentStock} units).
                Transaction blocked to prevent negative inventory balance.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Clear Form
            </button>

            <div className="relative group">
              <button
                type="submit"
                disabled={isBlocked || recordMutation.isPending}
                className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  isBlocked || recordMutation.isPending
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-75"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {recordMutation.isPending ? "Recording..." : "Record Movement"}
                </span>
              </button>
              {isBlocked && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-white rounded text-[11px] shadow-xl z-30 text-center pointer-events-none">
                  {isInsufficientStock
                    ? `Cannot submit: quantity exceeds available stock (${currentStock} units).`
                    : "Please specify a quantity greater than zero."}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
