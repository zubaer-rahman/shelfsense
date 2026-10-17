"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractPaginatedItems } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Product } from "@/types/domain";
import { PaginatedResponse } from "@/types/api";

export interface LowStockProduct extends Product {
  deficit: number;
}

export interface NearExpiryQueryParams {
  days?: number;
  page?: number;
  limit?: number;
}

export interface AlertQueryParams {
  page?: number;
  limit?: number;
}

export function useLowStockAlerts(params: AlertQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.alerts.lowStock(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/alerts/low-stock", {
        params: {
          page: params.page || 1,
          limit: params.limit || 5,
        },
      });

      const { items, total, page, limit, totalPages } =
        extractPaginatedItems<LowStockProduct>(res);

      return {
        data: items,
        items,
        total,
        page,
        limit,
        totalPages,
      } as PaginatedResponse<LowStockProduct>;
    },
    staleTime: 30 * 1000,
  });
}

export function useNearExpiryAlerts(params: NearExpiryQueryParams = {}) {
  const days = params.days ?? 30;
  return useQuery({
    queryKey: queryKeys.alerts.nearExpiry({ ...params, days }),
    queryFn: async () => {
      const res = await apiClient.get<any>("/alerts/near-expiry", {
        params: {
          days,
          page: params.page || 1,
          limit: params.limit || 5,
        },
      });

      const { items, total, page, limit, totalPages } =
        extractPaginatedItems<Product>(res);

      return {
        data: items,
        items,
        total,
        page,
        limit,
        totalPages,
      } as PaginatedResponse<Product>;
    },
    staleTime: 30 * 1000,
  });
}

export function useExpiredAlerts(params: AlertQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.alerts.expired(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/alerts/expired", {
        params: {
          page: params.page || 1,
          limit: params.limit || 5,
        },
      });

      const { items, total, page, limit, totalPages } =
        extractPaginatedItems<Product>(res);

      return {
        data: items,
        items,
        total,
        page,
        limit,
        totalPages,
      } as PaginatedResponse<Product>;
    },
    staleTime: 30 * 1000,
  });
}
