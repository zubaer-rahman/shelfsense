"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { User } from "@/types/domain";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useCurrentUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const res = await apiClient.get<{ user?: User } | User>("/auth/me");
      if (res && "user" in res && res.user) {
        return res.user;
      }
      return res as User;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    },
    onError: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
