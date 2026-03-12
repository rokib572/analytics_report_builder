import { useQuery } from "@tanstack/react-query"

export const useLocations = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      // TODO: implement — use apiClient.api.locations.$get()
    },
  })
}

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: async () => {
      // TODO: implement single location fetch
    },
    enabled: !!id,
  })
}
