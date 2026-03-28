import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api-client"

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
    },
  })
}
