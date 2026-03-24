import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await apiClient.api["current-user"].$get()
      if (!res.ok) throw new Error("Failed to fetch current user")
      return res.json()
    },
  })
