"use client";

import * as React from "react";
import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useSuppliers } from "@/hooks/api/use-suppliers";
import { useProducts } from "@/hooks/api/use-products";
import {
  usePurchaseOrders,
  useOrderPurchaseOrder,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from "@/hooks/api/use-purchase-orders";
import { POStatus, PurchaseOrder } from "@/types/domain";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreatePOModal } from "@/components/features/purchase-orders/create-po-modal";
import { PODetailInspector } from "@/components/features/purchase-orders/po-detail-inspector";
import { ReceiveConfirmDialog } from "@/components/features/purchase-orders/receive-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Building,
  Clock,
  FileText,
  PlusCircle,
  Download,
  ShieldAlert,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function PurchaseOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const activeTab = (searchParams.get("status") || "ALL") as POStatus | "ALL";
  const selectedSupplierFilter = searchParams.get("supplierId") || "ALL";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);

  const { user: currentUser } = useCurrentUser();
  const isOwner = currentUser?.role === "OWNER";

  // Suppliers and products queries to feed dropdowns
  const { data: suppliersData } = useSuppliers({ limit: 100 });
  const suppliers = suppliersData?.data || suppliersData?.items || [];

  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || productsData?.items || [];

  // Query purchase orders with pagination and filters
  const {
    data: posData,
    isLoading,
    isError,
    error,
    refetch: refetchPOs,
  } = usePurchaseOrders({
    page,
    limit: 20,
    status: activeTab !== "ALL" ? activeTab : undefined,
    supplierId: selectedSupplierFilter !== "ALL" ? selectedSupplierFilter : undefined,
  });

  const purchaseOrders = posData?.data || posData?.items || [];
  const totalRecords = posData?.total || 0;

  // Mutations
  const orderMutation = useOrderPurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();

  // Filtered by client search query
  const displayedPOs = useMemo(() => {
    if (!searchQuery.trim()) return purchaseOrders;
    const q = searchQuery.toLowerCase();
    return purchaseOrders.filter((po) => {
      const matchId = po.id.toLowerCase().includes(q);
      const matchSup = (po.supplier?.name || "").toLowerCase().includes(q);
      return matchId || matchSup;
    });
  }, [purchaseOrders, searchQuery]);

  // Sync selected PO object
  const selectedPO = useMemo(() => {
    if (!selectedPOId && displayedPOs.length > 0) {
      return displayedPOs[0];
    }
    return displayedPOs.find((p) => p.id === selectedPOId) || displayedPOs[0] || null;
  }, [displayedPOs, selectedPOId]);

  // Operational KPIs
  const inboundCount = purchaseOrders.filter((p) => p.status === "ORDERED").length;
  const draftCount = purchaseOrders.filter((p) => p.status === "DRAFT").length;
  const totalSpend = purchaseOrders
    .filter((p) => p.status !== "CANCELLED")
    .reduce((acc, p) => {
      const pTotal = p.items.reduce(
        (sum, it) => sum + (it.quantity || 0) * (Number(it.unitCost) || 0),
        0
      );
      return acc + pTotal;
    }, 0);

  // URL state update helper
  const updateParams = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === null || val === "" || val === "ALL") {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    }
    router.replace(`/purchase-orders?${next.toString()}`);
  };

  const handleTabChange = (status: POStatus | "ALL") => {
    updateParams({ status, page: 1 });
  };

  const handleSupplierFilterChange = (supId: string) => {
    updateParams({ supplierId: supId, page: 1 });
  };

  // Actions
  const handleOrder = async (orderId: string) => {
    try {
      await orderMutation.mutateAsync(orderId);
      toast.success("Order Submitted to Supplier", {
        description: `Purchase order ${orderId.slice(0, 8)} status transitioned to ORDERED.`,
      });
      refetchPOs();
    } catch (err: any) {
      toast.error("Failed to Submit Order", { description: err.message });
    }
  };

  const handleConfirmReceive = async () => {
    if (!receivingOrder) return;
    try {
      await receiveMutation.mutateAsync(receivingOrder.id);
      toast.success("Shipment Received & Restocked", {
        description: `Order ${receivingOrder.id.slice(0, 8)} items verified. Inventory updated.`,
      });
      setReceivingOrder(null);
      refetchPOs();
    } catch (err: any) {
      toast.error("Failed to Receive Order", { description: err.message });
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelMutation.mutateAsync(orderId);
      toast.info("Purchase Order Cancelled", {
        description: `Order ${orderId.slice(0, 8)} has been cancelled.`,
      });
      refetchPOs();
    } catch (err: any) {
      toast.error("Failed to Cancel Order", { description: err.message });
    }
  };

  const handleExportCSV = () => {
    if (displayedPOs.length === 0) {
      toast.info("No orders to export");
      return;
    }

    const headers = "PO Number,Supplier,Status,Items Count,Total Cost,Created Date\n";
    const rows = displayedPOs
      .map((po) => {
        const supName = po.supplier?.name || "Supplier";
        const count = po.items?.length || 0;
        const total = po.items
          ?.reduce(
            (acc, it) => acc + (it.quantity || 0) * (Number(it.unitCost) || 0),
            0
          )
          .toFixed(2);
        const date = po.createdAt ? format(new Date(po.createdAt), "yyyy-MM-dd") : "";
        return `"${po.id}","${supName}","${po.status}",${count},${total},"${date}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShelfSense_PurchaseOrders_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Purchase order registry exported to CSV");
  };

  // Staff Role Guard
  if (!isOwner) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Owner Authorization Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
          Purchase orders, wholesale supplier agreements, and restock intake verification are
          restricted to the <strong>Owner</strong> role. Staff members have permissions for store sales
          and inventory movement logging.
        </p>
        <p className="text-[11px] text-muted-foreground mt-3">
          (Use the floating Dev Toolbar at the bottom right to switch to the Owner role for simulation)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Purchase Orders
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
              Procurement Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track wholesale procurement, monitor restock deliveries, and verify intake.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export PO History</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Purchase Order</span>
          </Button>
        </div>
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inbound Transit */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Inbound Transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {inboundCount} Orders
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active supplier shipments en route
            </p>
          </div>
        </div>

        {/* Total Spend */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Total Order Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              ${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">
              Committed wholesale procurement
            </p>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Pending Restock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {inboundCount} Shipments
            </span>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
              Ready for verified intake
            </p>
          </div>
        </div>

        {/* Draft Batches */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Draft Batches
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {draftCount} Drafts
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Unsubmitted supplier carts
            </p>
          </div>
        </div>
      </div>

      {/* Main Asymmetric Grid: Orders Ledger (7 Cols) + Detail Inspector (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SECTION: PO Registry & Filters (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs & Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "DRAFT", label: "Draft" },
                  { id: "ORDERED", label: "Ordered" },
                  { id: "RECEIVED", label: "Received" },
                  { id: "CANCELLED", label: "Cancelled" },
                ] as const
              ).map((tab) => {
                const count =
                  tab.id === "ALL"
                    ? totalRecords
                    : purchaseOrders.filter((p) => p.status === tab.id).length;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] tabular-nums ${
                        isActive
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="relative w-full sm:flex-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PO number or supplier..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={selectedSupplierFilter}
                onChange={(e) => handleSupplierFilterChange(e.target.value)}
                className="w-full sm:w-44 h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master PO Table */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-10 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-4">PO Number</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-right">Lines</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-900 dark:text-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading purchase orders...
                      </td>
                    </tr>
                  ) : displayedPOs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No purchase orders matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedPOs.map((po) => {
                      const isSelected = selectedPO?.id === po.id;
                      const poTotal = po.items.reduce(
                        (sum, it) =>
                          sum + (it.quantity || 0) * (Number(it.unitCost) || 0),
                        0
                      );

                      return (
                        <tr
                          key={po.id}
                          onClick={() => setSelectedPOId(po.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-teal-50/70 dark:bg-teal-950/30 font-medium"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <div className="w-1.5 h-5 rounded-full bg-teal-600" />
                              )}
                              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                PO-{po.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span>{po.supplier?.name || "Supplier"}</span>
                              <span className="text-[10px] text-slate-400">
                                {po.createdAt
                                  ? format(new Date(po.createdAt), "MMM dd, yyyy")
                                  : ""}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                            {po.items.length} lines
                          </td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            ${poTotal.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <StatusBadge status={po.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            {po.status === "ORDERED" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReceivingOrder(po);
                                }}
                                className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                              >
                                Receive
                              </button>
                            )}
                            {po.status === "DRAFT" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrder(po.id);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                              >
                                Submit
                              </button>
                            )}
                            {po.status === "RECEIVED" && (
                              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                                Restocked
                              </span>
                            )}
                            {po.status === "CANCELLED" && (
                              <span className="text-[11px] text-slate-400">Void</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Showing {displayedPOs.length} of {totalRecords} records</span>
              <span className="font-mono text-[11px]">Click row to inspect & execute status transitions</span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Detail Inspector Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <PODetailInspector
            order={selectedPO}
            onOrder={handleOrder}
            onOpenReceive={setReceivingOrder}
            onCancel={handleCancel}
            isOrdering={orderMutation.isPending}
            isCancelling={cancelMutation.isPending}
          />
        </div>
      </div>

      {/* CREATE PO MODAL */}
      <CreatePOModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        suppliers={suppliers}
        products={products}
        onOrderCreated={(orderId) => {
          setSelectedPOId(orderId);
          refetchPOs();
        }}
      />

      {/* RECEIVE CONFIRM DIALOG */}
      <ReceiveConfirmDialog
        open={!!receivingOrder}
        onOpenChange={(open) => !open && setReceivingOrder(null)}
        order={receivingOrder}
        isLoading={receiveMutation.isPending}
        onConfirm={handleConfirmReceive}
      />
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading procurement portal...</div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
