import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api-client"
import { useApiScopeKey } from "../../../lib/auth-context"

export const useSyncOrders = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { startAt: string; endAt: string }) => {
      const res = await apiClient.api.sync.manual.$post({
        json: { type: "orders" as const, ...payload },
      })
      if (!res.ok) throw new Error("Failed to sync orders")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
      void queryClient.invalidateQueries({ queryKey: ["square-backfill-status"] })
    },
  })
}

export const useSyncCatalog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.api.sync.manual.$post({
        json: { type: "catalog" },
      })
      if (!res.ok) throw new Error("Failed to sync catalog")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] })
    },
  })
}

export const useBackfillStatus = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["square-backfill-status", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.sync["backfill-status"].$get()
      if (!res.ok) throw new Error("Failed to fetch backfill status")
      return res.json()
    },
    refetchInterval: (query) => {
      const status = query.state.data?.backfill?.status
      return status === "pending" || status === "running" ? 10000 : false
    },
  })
}
