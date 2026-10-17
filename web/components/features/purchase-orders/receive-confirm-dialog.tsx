"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PurchaseOrder } from "@/types/domain";
import { CheckCircle2, PackageCheck, AlertTriangle } from "lucide-react";

interface ReceiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ReceiveConfirmDialog({
  open,
  onOpenChange,
  order,
  isLoading,
  onConfirm,
}: ReceiveConfirmDialogProps) {
  if (!order) return null;

  const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
            <PackageCheck className="w-6 h-6 stroke-[1.8]" />
          </div>
          <DialogTitle>Receive & Restock Purchase Order</DialogTitle>
          <DialogDescription>
            Verify delivered wholesale shipment for{" "}
            <strong>{order.id.slice(0, 8)}</strong> from{" "}
            <strong>{order.supplier?.name || "Supplier"}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 space-y-1">
            <strong className="block font-semibold">Automatic Stock Ingestion:</strong>
            <p>
              Confirming receipt will atomically record <strong>{order.items.length}</strong> Stock
              In transactions and increment on-shelf quantities by{" "}
              <strong>{totalUnits} total units</strong>.
            </p>
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-border border border-border rounded-lg p-2">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="py-1.5 flex items-center justify-between text-[11px]"
              >
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-foreground">
                    {it.product?.name || "Product"}
                  </span>
                  <span className="text-muted-foreground ml-1 font-mono">
                    ({it.product?.sku})
                  </span>
                </div>
                <span className="font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                  +{it.quantity} units
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? "Restocking..." : "Confirm Delivery & Restock"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
