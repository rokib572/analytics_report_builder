import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const usePaymentMethodsList = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["payment-methods-list", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square["payment-methods"].$get()
      if (!res.ok) throw new Error("Failed to fetch payment methods")
      const json = (await res.json()) as { success: true; data: string[] }
      return json.data
    },
  })
}
