import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export const useSyncStatus = () => {
  return useQuery({
    queryKey: ["sync-status"],
    queryFn: async () => {
      // TODO: implement
    },
  })
}

export const useManualSync = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (_payload: { date: string; locationIds?: string[] }) => {
      // TODO: implement POST
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sync-status"] }),
  })
}
