"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractPaginatedItems } from "@/lib/api-client";
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
  days?: number;
  isActive?: boolean;
}

function matchesStockStatus(product: Product, status: string, days = 30): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (status) {
    case "OUT_OF_STOCK":
      return product.quantity <= 0;
    case "LOW_STOCK":
      return product.quantity <= product.reorderLevel;
    case "IN_STOCK":
      return product.quantity > product.reorderLevel;
    case "NEAR_EXPIRY": {
      if (!product.expiryDate) return false;
      const exp = new Date(product.expiryDate);
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(23, 59, 59, 999);
      return exp >= today && exp <= targetDate;
    }
    case "EXPIRED": {
      if (!product.expiryDate) return false;
      const exp = new Date(product.expiryDate);
      return exp < today;
    }
    default:
      return true;
  }
}

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const hasStockFilter =
        params.stockStatus &&
        params.stockStatus !== "All Status" &&
        params.stockStatus !== "ALL";

      if (!hasStockFilter) {
        const res = await apiClient.get<any>("/products", {
          params: {
            page: params.page || 1,
            limit: Math.min(params.limit || 10, 100),
            search: params.search,
            category: params.category === "All Categories" ? undefined : params.category,
            isActive: params.isActive,
          },
        });

        const { items, total, page, limit, totalPages } = extractPaginatedItems<Product>(res);

        return {
          data: items,
          items,
          total,
          page,
          limit,
          totalPages,
        } as PaginatedResponse<Product>;
      }

      // When filtering by stock or expiry status, fetch the full matching set and apply status logic
      const res = await apiClient.get<any>("/products", {
        params: {
          page: 1,
          limit: 100,
          search: params.search,
          category: params.category === "All Categories" ? undefined : params.category,
          isActive: params.isActive,
        },
      });

      const { items: allItems } = extractPaginatedItems<Product>(res);

      const filtered = allItems.filter((p) =>
        matchesStockStatus(p, params.stockStatus!, params.days || 30)
      );

      const page = params.page || 1;
      const limit = Math.min(params.limit || 10, 100);
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedItems,
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages,
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
