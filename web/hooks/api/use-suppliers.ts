"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Supplier } from "@/types/domain";
import { PaginatedResponse } from "@/types/api";
import { SupplierFormData } from "@/lib/validations/supplier";
import { toast } from "sonner";

export interface SupplierQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useSuppliers(params: SupplierQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/suppliers", {
        params: {
          page: params.page || 1,
          limit: params.limit || 50,
          search: params.search,
        },
      });

      if (res && Array.isArray(res.data)) {
        return res as PaginatedResponse<Supplier>;
      } else if (Array.isArray(res)) {
        return {
          data: res,
          total: res.length,
          page: 1,
          limit: res.length,
          totalPages: 1,
        } as PaginatedResponse<Supplier>;
      } else if (res && res.suppliers && Array.isArray(res.suppliers)) {
        return {
          data: res.suppliers,
          total: res.total ?? res.suppliers.length,
          page: res.page ?? 1,
          limit: res.limit ?? 50,
          totalPages: res.totalPages ?? 1,
        } as PaginatedResponse<Supplier>;
      }

      return {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
      } as PaginatedResponse<Supplier>;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplierFormData) =>
      apiClient.post<Supplier>("/suppliers", data),
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier registered", {
        description: `${newSupplier?.name || "Supplier"} partner added.`,
      });
    },
    onError: (err: any) => {
      toast.error("Registration failed", {
        description: err.message || "Failed to create supplier.",
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierFormData> }) =>
      apiClient.patch<Supplier>(`/suppliers/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier updated", {
        description: `${updated?.name || "Supplier"} details saved.`,
      });
    },
    onError: (err: any) => {
      toast.error("Update failed", {
        description: err.message || "Failed to update supplier.",
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Supplier>(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier deleted", {
        description: "Supplier partner removed from catalog.",
      });
    },
    onError: (err: any) => {
      toast.error("Deletion failed", {
        description: err.message || "Could not delete supplier.",
      });
    },
  });
}
