"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProducts, useDeactivateProduct } from "@/hooks/api/use-products";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductFormSheet } from "@/components/features/products/product-form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

const CATEGORIES = [
  "All Categories",
  "Antibiotics",
  "Analgesics",
  "Cardiovascular",
  "Respiratory",
  "Gastrointestinal",
  "Dermatology",
  "Vitamins & Supplements",
  "Emergency & First Aid",
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "All Status" },
  { label: "In Stock", value: "IN_STOCK" },
  { label: "Low Stock", value: "LOW_STOCK" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
];

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();

  // Read URL query params
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All Categories";
  const stockStatus = searchParams.get("status") || "All Status";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Search input local state for smooth typing & debouncing
  const [searchInput, setSearchInput] = React.useState(search);

  // Sync search input to URL on enter or debounce
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
      if (value === undefined || value === "" || value === "All Categories" || value === "All Status") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Query products from API
  const { data: productsData, isLoading, isError, error, refetch } = useProducts({
    page,
    limit: 10,
    search: search || undefined,
    category: category !== "All Categories" ? category : undefined,
    stockStatus: stockStatus !== "All Status" ? stockStatus : undefined,
  });

  const products = productsData?.data ?? [];
  const totalPages = productsData?.totalPages ?? 1;
  const totalRecords = productsData?.total ?? 0;

  // Sheet & Dialog state
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = React.useState<Product | null>(null);

  const deactivateMutation = useDeactivateProduct();

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setSheetOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingProduct) return;
    await deactivateMutation.mutateAsync(deactivatingProduct.id);
    setDeactivatingProduct(null);
  };

  // Helper to calculate stock status badge
  const getProductStockStatus = (p: Product) => {
    if (p.quantity <= 0) return "OUT_OF_STOCK";
    if (p.quantity <= p.reorderLevel) return "LOW_STOCK";
    return "IN_STOCK";
  };

  // Helper to calculate expiry status badge
  const getProductExpiryStatus = (p: Product) => {
    if (!p.expiryDate) return null;
    const expiry = new Date(p.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { status: "EXPIRED", label: "Expired" };
    if (diffDays <= 30) return { status: "NEAR_EXPIRY", label: `${diffDays}d left` };
    return { status: "GOOD", label: formatDate(p.expiryDate) };
  };

  // Table Columns
  const columns: Column<Product>[] = [
    {
      header: "Product & SKU",
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm leading-tight">
            {p.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground mt-0.5">
            {p.sku}
          </span>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (p) => (
        <span className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-foreground">
          {p.category}
        </span>
      ),
    },
    {
      header: "Stock Balance",
      cell: (p) => {
        const status = getProductStockStatus(p);
        return (
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-semibold text-sm text-foreground">
              {p.quantity}
            </span>
            <StatusBadge status={status} />
          </div>
        );
      },
    },
    {
      header: "Reorder Min",
      cell: (p) => (
        <span className="tabular-nums text-xs text-muted-foreground">
          {p.reorderLevel} units
        </span>
      ),
    },
    {
      header: "Unit Price",
      cell: (p) => (
        <span className="tabular-nums font-medium text-sm text-foreground">
          {formatCurrency(p.unitPrice)}
        </span>
      ),
    },
    {
      header: "Batch Expiry",
      cell: (p) => {
        const expiry = getProductExpiryStatus(p);
        if (!expiry) return <span className="text-muted-foreground text-xs">—</span>;
        return <StatusBadge status={expiry.status} label={expiry.label} />;
      },
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (p) => {
        const canEdit = can(user, "edit_product");
        if (!canEdit) return null;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(p)}
              title="Edit product"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeactivatingProduct(p)}
              title="Deactivate product"
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
      {/* Page Header */}
      <PageHeader
        title="Product Catalog"
        description="Search store inventory, track expiry thresholds, and register products."
        actions={
          can(user, "create_product") && (
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Register Product</span>
            </Button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name, category, or SKU..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Selector */}
          <select
            value={category}
            onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={stockStatus}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(search || category !== "All Categories" || stockStatus !== "All Status") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: undefined, category: undefined, status: undefined, page: 1 });
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Products DataTable with 4 states */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load products"}
        onRetry={() => refetch()}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => updateParams({ page: p })}
        emptyState={{
          icon: Package,
          title: search ? "No matching products" : "No products in catalog",
          description: search
            ? `No records found matching "${search}". Try adjusting your search query or filters.`
            : "Register your first product to begin tracking store inventory and expiration dates.",
          actionText: can(user, "create_product") ? "Register First Product" : undefined,
          onAction: can(user, "create_product") ? handleOpenCreate : undefined,
        }}
      />

      {/* Create / Edit Slide-Over Sheet */}
      <ProductFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        productToEdit={editingProduct}
      />

      {/* Deactivate Confirm Modal */}
      <ConfirmDialog
        open={!!deactivatingProduct}
        onOpenChange={(open) => !open && setDeactivatingProduct(null)}
        title="Deactivate Product"
        description={`Are you sure you want to deactivate "${deactivatingProduct?.name}" (${deactivatingProduct?.sku})? This will archive the item from active store ordering.`}
        confirmText="Deactivate"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
