import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiClient.api.users.$get()
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })
