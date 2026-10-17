"use client";

import * as React from "react";
import { PurchaseOrder } from "@/types/domain";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Truck,
  CheckCircle2,
  Check,
  XCircle,
  Printer,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface PODetailInspectorProps {
  order: PurchaseOrder | null;
  onOrder: (orderId: string) => void;
  onOpenReceive: (order: PurchaseOrder) => void;
  onCancel: (orderId: string) => void;
  isOrdering?: boolean;
  isCancelling?: boolean;
}

export function PODetailInspector({
  order,
  onOrder,
  onOpenReceive,
  onCancel,
  isOrdering,
  isCancelling,
}: PODetailInspectorProps) {
  if (!order) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-muted-foreground shadow-xs">
        <FileText className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2 stroke-[1.5]" />
        <p className="font-medium text-foreground">No Purchase Order Selected</p>
        <p className="mt-1">Click any order in the registry to inspect details and execute workflow transitions.</p>
      </div>
    );
  }

  const orderTotal = order.items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (Number(it.unitCost) || 0),
    0
  );

  const handlePrint = () => {
    toast.info("Invoice Document Ready", {
      description: `Opening printable view for purchase order ${order.id.slice(0, 8)}.`,
    });
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const isDraft = order.status === "DRAFT";
  const isOrdered = order.status === "ORDERED";
  const isReceived = order.status === "RECEIVED";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              PO-{order.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">
            {order.supplier?.name || "Supplier Partner"}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span>
              Created: {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "N/A"}
            </span>
            <span>•</span>
            <span>By: {order.createdBy?.name || "Store Owner"}</span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Print Purchase Order"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Status Stepper */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between relative px-2">
          {/* Step 1: Draft */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                !isDraft && !isCancelled
                  ? "bg-teal-600 text-white"
                  : isDraft
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ring-4 ring-slate-100 dark:ring-slate-800"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {!isDraft && !isCancelled ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Draft
            </span>
          </div>

          {/* Line 1 */}
          <div
            className={`flex-1 h-0.5 -mx-1 transition-colors ${
              isOrdered || isReceived
                ? "bg-teal-600"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />

          {/* Step 2: Ordered */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isReceived
                  ? "bg-teal-600 text-white"
                  : isOrdered
                  ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {isReceived ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Ordered
            </span>
          </div>

          {/* Line 2 */}
          <div
            className={`flex-1 h-0.5 -mx-1 transition-colors ${
              isReceived ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"
            }`}
          />

          {/* Step 3: Received */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isReceived
                  ? "bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-950/60"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {isReceived ? <Check className="w-4 h-4" /> : "3"}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Received
            </span>
          </div>
        </div>

        {/* Supplier Contact Strip */}
        <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{order.supplier?.email || "Direct EDI dispatch"}</span>
          </div>
          {order.supplier?.phone && (
            <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{order.supplier.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="p-4 space-y-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
          Procured Line Items ({order.items.length})
        </span>
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Unit Cost</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {order.items.map((it) => {
                const cost = Number(it.unitCost) || 0;
                return (
                  <tr key={it.id}>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {it.product?.name || "Product Item"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {it.product?.sku}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums font-medium">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      ${cost.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      ${(it.quantity * cost).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Subtotals & Total Net Payable */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium">${orderTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Wholesale Tax</span>
            <span className="tabular-nums font-medium">$0.00</span>
          </div>
          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-sm">
            <span>Total Net Payable</span>
            <span className="text-teal-600 dark:text-teal-400 tabular-nums font-bold">
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Action Workflow Stepper Controls */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* If ORDERED: Allow Receive */}
        {isOrdered && (
          <Button
            size="sm"
            onClick={() => onOpenReceive(order)}
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Receive Order (Verify Delivery & Restock)</span>
          </Button>
        )}

        {/* If DRAFT: Allow Submit Order */}
        {isDraft && (
          <Button
            size="sm"
            onClick={() => onOrder(order.id)}
            disabled={isOrdering}
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>
              {isOrdering ? "Submitting Order..." : "Submit & Order from Supplier"}
            </span>
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Order</span>
          </Button>

          {/* Cancel Transition (allowed from Draft or Ordered) */}
          {(isDraft || isOrdered) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancel(order.id)}
              disabled={isCancelling}
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isCancelling ? "Cancelling..." : "Cancel Order"}</span>
            </Button>
          )}

          {(isReceived || isCancelled) && (
            <div className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs text-center font-medium flex items-center justify-center">
              {isReceived ? "Restock Ingested" : "Order Cancelled"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
