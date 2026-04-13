import { useQuery } from "@tanstack/react-query"
import { apiClient, getApiAccountId } from "../../lib/api-client"

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["current-user", getApiAccountId() ?? "default"],
    queryFn: async () => {
      const res = await apiClient.api["current-user"].$get()
      if (!res.ok) throw new Error("Failed to fetch current user")
      return res.json()
    },
  })
