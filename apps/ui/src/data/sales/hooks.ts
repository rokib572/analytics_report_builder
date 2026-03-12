import { useQuery } from "@tanstack/react-query"

export const useSales = (locationId: string, date: string) => {
  return useQuery({
    queryKey: ["sales", locationId, date],
    queryFn: async () => {
      // TODO: implement — response includes current date + YoY
    },
    enabled: !!locationId && !!date,
  })
}
