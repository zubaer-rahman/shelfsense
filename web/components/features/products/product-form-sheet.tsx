"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormInput, ProductFormData } from "@/lib/validations/product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/domain";
import { useSuppliers } from "@/hooks/api/use-suppliers";
import { useCreateProduct, useUpdateProduct } from "@/hooks/api/use-products";
import { Package, Calendar, DollarSign, Layers } from "lucide-react";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
}

const CATEGORIES = [
  "Beverages",
  "Pantry",
  "Bakery",
  "Dairy",
  "Household",
  "Other",
];

export function ProductFormSheet({
  open,
  onOpenChange,
  productToEdit,
}: ProductFormSheetProps) {
  const isEditing = !!productToEdit;
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();
  const suppliers = suppliersData?.data ?? [];

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, any, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "Beverages",
      unitPrice: 0,
      quantity: 0,
      reorderLevel: 10,
      expiryDate: "",
      supplierId: "",
    },
  });

  // Populate form when editing or opening
  React.useEffect(() => {
    if (open) {
      if (productToEdit) {
        reset({
          name: productToEdit.name,
          sku: productToEdit.sku,
          category: productToEdit.category,
          unitPrice: Number(productToEdit.unitPrice),
          quantity: productToEdit.quantity,
          reorderLevel: productToEdit.reorderLevel,
          expiryDate: productToEdit.expiryDate
            ? productToEdit.expiryDate.slice(0, 10)
            : "",
          supplierId: productToEdit.supplierId,
        });
      } else {
        reset({
          name: "",
          sku: "",
          category: "Beverages",
          unitPrice: 12.5,
          quantity: 50,
          reorderLevel: 20,
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          supplierId: suppliers[0]?.id || "",
        });
      }
    }
  }, [open, productToEdit, reset, suppliers]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && productToEdit) {
        await updateMutation.mutateAsync({
          id: productToEdit.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error is handled in mutation hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span>{isEditing ? "Edit Product Details" : "Register New Product"}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update product specifications, reorder levels, or pricing."
              : "Register an item into the store product catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Product Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Amoxicillin 500mg Capsules"
              error={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* SKU and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                SKU / Code <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. AMX-500-CAP"
                className="font-mono uppercase"
                error={!!errors.sku}
                {...register("sku")}
              />
              {errors.sku && (
                <p className="text-[11px] text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("category")}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-[11px] text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Supplier Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Approved Supplier <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoadingSuppliers}
              {...register("supplierId")}
            >
              <option value="">Select a supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactName || "Direct Supplier"})
                </option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="text-[11px] text-destructive">{errors.supplierId.message}</p>
            )}
          </div>

          {/* Pricing, Quantity, and Reorder Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Unit Price ($) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  error={!!errors.unitPrice}
                  {...register("unitPrice")}
                />
              </div>
              {errors.unitPrice && (
                <p className="text-[11px] text-destructive">{errors.unitPrice.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Initial Quantity
              </label>
              <div className="relative">
                <Layers className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                <Input
                  type="number"
                  min="0"
                  className="pl-8"
                  disabled={isEditing}
                  error={!!errors.quantity}
                  {...register("quantity")}
                />
              </div>
              {errors.quantity && (
                <p className="text-[11px] text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Safety Threshold
              </label>
              <Input
                type="number"
                min="0"
                error={!!errors.reorderLevel}
                {...register("reorderLevel")}
              />
              {errors.reorderLevel && (
                <p className="text-[11px] text-destructive">{errors.reorderLevel.message}</p>
              )}
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Batch Expiry Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                type="date"
                className="pl-9"
                error={!!errors.expiryDate}
                {...register("expiryDate")}
              />
            </div>
            {errors.expiryDate && (
              <p className="text-[11px] text-destructive">{errors.expiryDate.message}</p>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? "Save Changes" : "Register Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
