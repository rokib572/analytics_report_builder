import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export type Channel = {
  id: string
  customerId: string
  squareSourceName: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export const useChannels = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["channels", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square.channels.$get()
      if (!res.ok) throw new Error("Failed to fetch channels")
      const json = (await res.json()) as { success: true; data: Channel[] }
      return json.data
    },
  })
}
