import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"
import { useApiScopeKey } from "../../lib/auth-context"

export const useUsers = () => {
  const scopeKey = useApiScopeKey()

  return useQuery({
    queryKey: ["users", scopeKey],
    queryFn: async () => {
      const res = await apiClient.api.users.$get()
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })
}
