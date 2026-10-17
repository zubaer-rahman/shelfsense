"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Product } from "@/types/domain";
import { PaginatedResponse } from "@/types/api";
import { ProductFormData } from "@/lib/validations/product";
import { toast } from "sonner";

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: string;
  isActive?: boolean;
}

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const res = await apiClient.get<any>("/products", {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search,
          category: params.category === "All Categories" ? undefined : params.category,
          stockStatus: params.stockStatus === "All Status" ? undefined : params.stockStatus,
          isActive: params.isActive,
        },
      });

      // Handle PaginatedResponse envelope from backend
      if (res && Array.isArray(res.data)) {
        return res as PaginatedResponse<Product>;
      } else if (Array.isArray(res)) {
        return {
          data: res,
          total: res.length,
          page: 1,
          limit: res.length,
          totalPages: 1,
        } as PaginatedResponse<Product>;
      } else if (res && res.products && Array.isArray(res.products)) {
        return {
          data: res.products,
          total: res.total ?? res.products.length,
          page: res.page ?? 1,
          limit: res.limit ?? 10,
          totalPages: res.totalPages ?? 1,
        } as PaginatedResponse<Product>;
      }

      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      } as PaginatedResponse<Product>;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) =>
      apiClient.post<Product>("/products", data),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      toast.success("Product registered", {
        description: `${newProduct?.name || "Product"} added to catalog.`,
      });
    },
    onError: (err: any) => {
      toast.error("Registration failed", {
        description: err.message || "Failed to create product.",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      apiClient.patch<Product>(`/products/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      toast.success("Product updated", {
        description: `${updated?.name || "Product"} details saved.`,
      });
    },
    onError: (err: any) => {
      toast.error("Update failed", {
        description: err.message || "Failed to update product.",
      });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Product>(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      toast.success("Product deactivated", {
        description: "The product has been removed from active ordering.",
      });
    },
    onError: (err: any) => {
      toast.error("Deactivation failed", {
        description: err.message || "Could not deactivate product.",
      });
    },
  });
}
