import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/api-client"

export const useLocations = () =>
  useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await apiClient.api.square.locations.list.$get()
      if (!res.ok) throw new Error("Failed to fetch locations")
      return res.json()
    },
  })

export const useLocation = (id: string) =>
  useQuery({
    queryKey: ["locations", id],
    queryFn: async () => {
      const res = await apiClient.api.square.locations.get[":id"].$get({ param: { id } })
      if (!res.ok) throw new Error("Failed to fetch location")
      return res.json()
    },
    enabled: !!id,
  })

export const useSyncLocations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.api.sync.manual.$post({
        json: { type: "locations" },
      })
      if (!res.ok) throw new Error("Failed to sync locations")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
  })
}
