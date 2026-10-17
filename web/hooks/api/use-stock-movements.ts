"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { StockMovement, MovementType, AdjustmentDirection } from "@/types/domain";
import { PaginatedResponse } from "@/types/api";

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
}

export interface RecordStockMovementPayload {
  productId: string;
  type: MovementType;
  quantity: number;
  direction?: AdjustmentDirection;
  note?: string;
}

export interface RecordMovementResponse {
  movement: StockMovement;
  currentStock: number;
}

export function useStockMovements(params: StockMovementQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.stock.movements(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/stock/movements", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          productId: params.productId,
          type: params.type,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      });

      const list: StockMovement[] =
        res?.items || res?.data || (Array.isArray(res) ? res : []);

      return {
        data: list,
        items: list,
        total: res?.total ?? list.length,
        page: res?.page ?? (params.page || 1),
        limit: res?.limit ?? (params.limit || 20),
        totalPages: res?.totalPages ?? 1,
      } as PaginatedResponse<StockMovement>;
    },
    placeholderData: (prev) => prev,
  });
}

export function useRecordStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordStockMovementPayload) => {
      // Omit direction if not ADJUSTMENT to strictly comply with backend DTO rules
      const body: Record<string, any> = {
        productId: payload.productId,
        type: payload.type,
        quantity: payload.quantity,
        note: payload.note,
      };

      if (payload.type === "ADJUSTMENT" && payload.direction) {
        body.direction = payload.direction;
      }

      return apiClient.post<RecordMovementResponse>("/stock/movements", body);
    },
    onSuccess: () => {
      // Invalidation rules from SHELFSENSE_FRONTEND_PLAN.md:
      // Stock movement: invalidate products, movements, alerts, dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
