"use client";

import * as React from "react";
import { StockMovement, MovementType, Product } from "@/types/domain";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { Download, History, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface MovementHistoryTableProps {
  movements: StockMovement[];
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  typeFilter?: MovementType | "ALL";
  onTypeFilterChange: (type: MovementType | "ALL") => void;
  productFilter?: string;
  onProductFilterChange: (productId: string) => void;
}

export const MovementHistoryTable = React.memo(function MovementHistoryTable({
  movements,
  products,
  isLoading,
  isError,
  error,
  onRetry,
  page,
  totalPages,
  totalRecords,
  onPageChange,
  typeFilter = "ALL",
  onTypeFilterChange,
  productFilter = "ALL",
  onProductFilterChange,
}: MovementHistoryTableProps) {
  // Export CSV handler
  const handleExportCSV = () => {
    if (movements.length === 0) {
      toast.info("No Records to Export", {
        description: "There are no movement logs matching the current criteria.",
      });
      return;
    }

    const headers = "Timestamp,Product Name,SKU,Type,Quantity,Logged By,Note\n";
    const rows = movements
      .map((m) => {
        const dateStr = m.createdAt ? format(new Date(m.createdAt), "yyyy-MM-dd HH:mm:ss") : "";
        const prodName = m.product?.name || "Unknown Product";
        const sku = m.product?.sku || "";
        const loggedBy = m.user?.name || m.user?.email || "System";
        const note = (m.note || "").replace(/"/g, '""');
        return `"${dateStr}","${prodName}","${sku}","${m.type}",${m.quantity},"${loggedBy}","${note}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShelfSense_Stock_AuditLog_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Audit Log Exported", {
      description: `${movements.length} logged stock movements exported to CSV.`,
    });
  };

  const columns: Column<StockMovement>[] = [
    {
      header: "Timestamp",
      cell: (m) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground tabular-nums">
            {m.createdAt ? format(new Date(m.createdAt), "MMM dd, yyyy") : "N/A"}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {m.createdAt ? format(new Date(m.createdAt), "hh:mm a") : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Product & SKU",
      cell: (m) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground truncate max-w-[200px] sm:max-w-[260px]">
            {m.product?.name || "Product Record"}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {m.product?.sku || m.productId.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      header: "Movement Type",
      cell: (m) => <StatusBadge status={m.type} />,
    },
    {
      header: "Signed Units",
      cell: (m) => {
        const isNegative = m.quantity < 0;
        return (
          <span
            className={`font-semibold text-xs tabular-nums ${
              isNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-teal-600 dark:text-teal-400"
            }`}
          >
            {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
          </span>
        );
      },
    },
    {
      header: "Logged By",
      cell: (m) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {m.user?.name || "Authorized Staff"}
          </span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {m.user?.email || "internal audit"}
          </span>
        </div>
      ),
    },
    {
      header: "Reference Note",
      cell: (m) => (
        <span className="text-xs text-muted-foreground italic truncate max-w-[180px] block">
          {m.note || "—"}
        </span>
      ),
    },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col overflow-hidden transition-colors">
      {/* Header & Filter Controls */}
      <div className="p-5 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Movement History
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total {totalRecords} logged transaction events in audit ledger
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 self-start sm:self-auto h-8 text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log (.CSV)</span>
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Movement Type Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold overflow-x-auto">
            {(
              [
                { id: "ALL", label: "All Movements" },
                { id: "SALE", label: "Sales" },
                { id: "STOCK_IN", label: "Stock In" },
                { id: "ADJUSTMENT", label: "Adjustments" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTypeFilterChange(tab.id)}
                className={`px-3 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  typeFilter === tab.id
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={productFilter}
              onChange={(e) => onProductFilterChange(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[220px]"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="p-0">
        <DataTable
          columns={columns}
          data={movements}
          keyExtractor={(m) => m.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onRetry={onRetry}
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          emptyState={{
            icon: History,
            title: "No Stock Movements Logged",
            description:
              typeFilter !== "ALL" || productFilter !== "ALL"
                ? "No movement records match the selected filter criteria."
                : "No sales, shipments, or manual inventory reconciliations have been performed yet.",
          }}
        />
      </div>
    </section>
  );
});
