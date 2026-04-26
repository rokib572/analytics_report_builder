import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const useSquareCustomerNamesList = () => {
  const apiScopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["square-customer-names", apiScopeKey],
    queryFn: async () => {
      const res = await apiClient.api.square.customers.names.$get()
      if (!res.ok) throw new Error("Failed to fetch customer names")
      const json = (await res.json()) as { success: true; data: string[] }
      return json.data
    },
  })
}
