"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSuppliers, useDeleteSupplier } from "@/hooks/api/use-suppliers";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SupplierModal } from "@/components/features/suppliers/supplier-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Supplier } from "@/types/domain";
import { formatDate } from "@/lib/format";
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  RotateCcw,
} from "lucide-react";

function SuppliersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();

  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = React.useState(search);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput || undefined, page: 1 });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(newParams)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const { data: suppliersData, isLoading, isError, error, refetch } = useSuppliers({
    page,
    limit: 10,
    search: search || undefined,
  });

  const suppliers = suppliersData?.data ?? [];
  const totalPages = suppliersData?.totalPages ?? 1;
  const totalRecords = suppliersData?.total ?? 0;

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = React.useState<Supplier | null>(null);

  const deleteMutation = useDeleteSupplier();

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    await deleteMutation.mutateAsync(deletingSupplier.id);
    setDeletingSupplier(null);
  };

  const columns: Column<Supplier>[] = [
    {
      header: "Company Name",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground text-sm">
            {s.name}
          </span>
        </div>
      ),
    },
    {
      header: "Dispatch Email",
      cell: (s) =>
        s.email ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span>{s.email}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Contact Phone",
      cell: (s) =>
        s.phone ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span>{s.phone}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Partner Since",
      cell: (s) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(s.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (s) => {
        const canManage = can(user, "manage_suppliers");
        if (!canManage) return null;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(s)}
              title="Edit supplier"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingSupplier(s)}
              title="Delete supplier"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Supplier Partners"
        description="Manage approved wholesale distributors, vendors, and procurement contacts."
        actions={
          can(user, "manage_suppliers") && (
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Register Supplier</span>
            </Button>
          )
        }
      />

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search supplier by name or email..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              updateParams({ search: undefined, page: 1 });
            }}
            className="h-9 px-2.5 text-xs text-muted-foreground gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Data Table with 4 states */}
      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load suppliers"}
        onRetry={() => refetch()}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => updateParams({ page: p })}
        emptyState={{
          icon: Building2,
          title: search ? "No matching suppliers" : "No suppliers registered",
          description: search
            ? `No records found matching "${search}".`
            : "Register your first approved wholesale distributor to attach products and create purchase orders.",
          actionText: can(user, "manage_suppliers") ? "Register First Supplier" : undefined,
          onAction: can(user, "manage_suppliers") ? handleOpenCreate : undefined,
        }}
      />

      {/* Create / Edit Modal */}
      <SupplierModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        supplierToEdit={editingSupplier}
      />

      {/* Delete Confirm Modal */}
      <ConfirmDialog
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        title="Delete Supplier Partner"
        description={`Are you sure you want to remove "${deletingSupplier?.name}"? If there are active catalog products linked to this supplier, deletion may be rejected by the ledger.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading suppliers...</div>}>
      <SuppliersContent />
    </Suspense>
  );
}
