"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormData } from "@/lib/validations/supplier";
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
import { Supplier } from "@/types/domain";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/api/use-suppliers";
import { Building2, Phone, Mail } from "lucide-react";

interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierToEdit?: Supplier | null;
}

export function SupplierModal({
  open,
  onOpenChange,
  supplierToEdit,
}: SupplierModalProps) {
  const isEditing = !!supplierToEdit;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (supplierToEdit) {
        reset({
          name: supplierToEdit.name,
          phone: supplierToEdit.phone || "",
          email: supplierToEdit.email || "",
        });
      } else {
        reset({
          name: "",
          phone: "",
          email: "",
        });
      }
    }
  }, [open, supplierToEdit, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (isEditing && supplierToEdit) {
        await updateMutation.mutateAsync({
          id: supplierToEdit.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Handled in mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>{isEditing ? "Edit Supplier Partner" : "Register Supplier Partner"}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update company name or contact details."
              : "Register an approved distributor, vendor, or supplier."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Supplier Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Apex Health & Pharma Ltd."
              error={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Order Dispatch Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              <Input
                type="email"
                placeholder="sales@apexpharma.com"
                className="pl-9"
                error={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              <Input
                type="tel"
                placeholder="+1-555-0199"
                className="pl-9"
                error={!!errors.phone}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? "Save Changes" : "Register Partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
