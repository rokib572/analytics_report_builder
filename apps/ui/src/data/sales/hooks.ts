import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const useDashboardSummary = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["dashboard-summary", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square["daily-sales"].summary.$get({ query: {} })
      if (!res.ok) throw new Error("Failed to fetch dashboard summary")
      return res.json()
    },
  })
}
