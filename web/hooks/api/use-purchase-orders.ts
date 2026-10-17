"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractPaginatedItems } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { PurchaseOrder, POStatus } from "@/types/domain";
import { PaginatedResponse } from "@/types/api";

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  status?: POStatus;
  supplierId?: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}

export function usePurchaseOrders(params: PurchaseOrderQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.list(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/purchase-orders", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status,
          supplierId: params.supplierId,
        },
      });

      const { items, total, page, limit, totalPages } =
        extractPaginatedItems<PurchaseOrder>(res);

      return {
        data: items,
        items,
        total,
        page,
        limit,
        totalPages,
      } as PaginatedResponse<PurchaseOrder>;
    },
    placeholderData: (prev) => prev,
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.detail(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<{ purchaseOrder: PurchaseOrder }>(
        `/purchase-orders/${id}`
      );
      return res?.purchaseOrder || (res as unknown as PurchaseOrder);
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePurchaseOrderPayload) => {
      const res = await apiClient.post<{ purchaseOrder: PurchaseOrder }>(
        "/purchase-orders",
        payload
      );
      return res.purchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
}

export function useOrderPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<{ purchaseOrder: PurchaseOrder }>(
        `/purchase-orders/${id}/order`
      );
      return res.purchaseOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.setQueryData(queryKeys.purchaseOrders.detail(data.id), data);
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<{ purchaseOrder: PurchaseOrder }>(
        `/purchase-orders/${id}/receive`
      );
      return res.purchaseOrder;
    },
    onSuccess: (data) => {
      // Invalidation rules per SHELFSENSE_FRONTEND_PLAN.md:
      // On receive: invalidate purchase orders, products, movements, alerts, dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.setQueryData(queryKeys.purchaseOrders.detail(data.id), data);
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<{ purchaseOrder: PurchaseOrder }>(
        `/purchase-orders/${id}/cancel`
      );
      return res.purchaseOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.setQueryData(queryKeys.purchaseOrders.detail(data.id), data);
    },
  });
}
