import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await apiClient.api.square["daily-sales"].summary.$get({ query: {} })
      if (!res.ok) throw new Error("Failed to fetch dashboard summary")
      return res.json()
    },
  })
