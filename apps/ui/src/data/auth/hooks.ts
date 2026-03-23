import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiClient.api.me.$get()
      if (!res.ok) throw new Error("Failed to fetch current user")
      return res.json()
    },
  })
