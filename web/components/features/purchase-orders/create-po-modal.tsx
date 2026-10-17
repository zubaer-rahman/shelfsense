"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Supplier, Product } from "@/types/domain";
import { useCreatePurchaseOrder } from "@/hooks/api/use-purchase-orders";
import { Plus, Trash2, ClipboardList, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CreatePOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  products: Product[];
  onOrderCreated?: (orderId: string) => void;
}

interface POLineItemDraft {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function CreatePOModal({
  open,
  onOpenChange,
  suppliers,
  products,
  onOrderCreated,
}: CreatePOModalProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ""
  );
  const [items, setItems] = useState<POLineItemDraft[]>([]);

  const createMutation = useCreatePurchaseOrder();

  // Keep selected supplier in sync with available list
  React.useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Products belonging strictly to the selected supplier
  const supplierProducts = useMemo(() => {
    return products.filter((p) => p.supplierId === selectedSupplierId && p.isActive);
  }, [products, selectedSupplierId]);

  // Whenever supplier changes, reset line items to first available supplier product
  React.useEffect(() => {
    if (supplierProducts.length > 0) {
      setItems([
        {
          productId: supplierProducts[0].id,
          quantity: 25,
          unitCost: supplierProducts[0].unitPrice || 1.0,
        },
      ]);
    } else {
      setItems([]);
    }
  }, [selectedSupplierId, supplierProducts.length]);

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
  };

  const handleAddRow = () => {
    if (supplierProducts.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        productId: supplierProducts[0].id,
        quantity: 10,
        unitCost: supplierProducts[0].unitPrice || 1.0,
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx: number, prodId: string) => {
    const prod = supplierProducts.find((p) => p.id === prodId);
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        productId: prodId,
        unitCost: prod?.unitPrice ?? updated[idx].unitCost,
      };
      return updated;
    });
  };

  const handleQtyChange = (idx: number, qty: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: Math.max(1, qty) };
      return updated;
    });
  };

  const handleCostChange = (idx: number, cost: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], unitCost: Math.max(0, cost) };
      return updated;
    });
  };

  const totalCost = items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0),
    0
  );

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (items.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        supplierId: selectedSupplierId,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
        })),
      });

      toast.success("Purchase Order Created", {
        description: `Draft order ${created.id.slice(0, 8)} created with ${
          items.length
        } items.`,
      });

      onOpenChange(false);
      onOrderCreated?.(created.id);
    } catch (err: any) {
      toast.error("Failed to Create Order", {
        description: err.message || "An error occurred while creating order.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <span>New Purchase Order</span>
          </DialogTitle>
          <DialogDescription>
            Draft a procurement order from an approved wholesale supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Supplier Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Supplying Partner <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.email ? `(${s.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Catalog Warning if empty */}
          {supplierProducts.length === 0 && (
            <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>No Active Products Linked:</strong> The selected supplier currently has no
                registered active catalog products. Please assign products to this supplier first
                in the Product Catalog.
              </div>
            </div>
          )}

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Line Items ({items.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                disabled={supplierProducts.length === 0}
                className="gap-1 h-7 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No items added yet. Click &quot;Add Item&quot; to begin drafting this order.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    {/* Product Select */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Product
                      </label>
                      <select
                        value={row.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none cursor-pointer"
                      >
                        {supplierProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          handleQtyChange(idx, parseInt(e.target.value, 10) || 1)
                        }
                        className="h-8 text-xs tabular-nums"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="w-28">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Unit Cost ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCost}
                        onChange={(e) =>
                          handleCostChange(idx, parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-xs tabular-nums"
                      />
                    </div>

                    {/* Row Total */}
                    <div className="w-24 text-right sm:self-center pt-2 sm:pt-0">
                      <span className="text-[10px] text-muted-foreground block sm:hidden">
                        Subtotal
                      </span>
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        ${(row.quantity * row.unitCost).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded self-end sm:self-center transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Cost Calculation Banner */}
            <div className="p-3.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Estimated Order Subtotal:
              </span>
              <span className="text-base font-bold text-primary tabular-nums">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={items.length === 0 || createMutation.isPending}
            className="gap-1.5"
          >
            <ClipboardList className="w-4 h-4" />
            <span>
              {createMutation.isPending ? "Creating Draft..." : "Create Draft Order"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
