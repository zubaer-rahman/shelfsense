"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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

      const list: LowStockProduct[] =
        res?.items || res?.data || (Array.isArray(res) ? res : []);

      return {
        data: list,
        items: list,
        total: res?.total ?? list.length,
        page: res?.page ?? (params.page || 1),
        limit: res?.limit ?? (params.limit || 5),
        totalPages: res?.totalPages ?? 1,
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

      const list: Product[] =
        res?.items || res?.data || (Array.isArray(res) ? res : []);

      return {
        data: list,
        items: list,
        total: res?.total ?? list.length,
        page: res?.page ?? (params.page || 1),
        limit: res?.limit ?? (params.limit || 5),
        totalPages: res?.totalPages ?? 1,
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

      const list: Product[] =
        res?.items || res?.data || (Array.isArray(res) ? res : []);

      return {
        data: list,
        items: list,
        total: res?.total ?? list.length,
        page: res?.page ?? (params.page || 1),
        limit: res?.limit ?? (params.limit || 5),
        totalPages: res?.totalPages ?? 1,
      } as PaginatedResponse<Product>;
    },
    staleTime: 30 * 1000,
  });
}
