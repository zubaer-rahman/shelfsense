"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { PurchaseOrder } from "@/types/domain";

export interface ForecastDailyPoint {
  date: string;
  quantity: number;
}

export interface ForecastResponse {
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    quantity: number;
    reorderLevel: number;
    supplier: {
      id: string;
      name: string;
      email?: string;
    };
  };
  strategy: string;
  window: number;
  expectedDailyDemand: number;
  currentStock: number;
  leadTimeDays: number;
  safetyBuffer: number;
  suggestedReorderQuantity: number;
  dailySeries: ForecastDailyPoint[];
}

export interface ForecastQueryParams {
  strategy?: "moving_average" | "linear_regression" | "naive";
  window?: number;
}

export function useProductForecast(
  productId?: string,
  params: ForecastQueryParams = {}
) {
  return useQuery({
    queryKey: ["forecast", productId, params.strategy, params.window],
    queryFn: async () => {
      if (!productId) return null;
      return apiClient.get<ForecastResponse>(`/forecast/${productId}`, {
        params: {
          strategy: params.strategy || "moving_average",
          window: params.window || 14,
        },
      });
    },
    enabled: !!productId,
  });
}

export function useCreatePOFromForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      params,
    }: {
      productId: string;
      params?: ForecastQueryParams;
    }) => {
      const res = await apiClient.post<{ purchaseOrder: PurchaseOrder }>(
        `/forecast/${productId}/create-po`,
        undefined,
        {
          params: {
            strategy: params?.strategy || "moving_average",
            window: params?.window || 14,
          },
        }
      );
      return res?.purchaseOrder || (res as unknown as PurchaseOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
}
