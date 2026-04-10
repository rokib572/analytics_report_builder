import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api-client"

export type InventoryCount = {
  id: string
  locationId: string
  locationName: string
  catalogObjectId: string
  catalogItemVariationId: string | null
  itemName: string | null
  variationName: string | null
  sku: string | null
  state: string
  quantity: string
  calculatedAt: string
}

type InventoryCountsResponse = {
  success: true
  items: InventoryCount[]
  pagination: {
    page: number
    limit: number
    totalCount: number
  }
}

type UseInventoryCountsOptions = {
  page: number
  limit: number
  locationId?: string
  search?: string
}

export const useInventoryCounts = ({
  page,
  limit,
  locationId,
  search,
}: UseInventoryCountsOptions) =>
  useQuery({
    queryKey: ["inventory-counts", page, limit, locationId, search],
    queryFn: async () => {
      const res = await apiClient.api.square.inventory.list.$get({
        query: {
          page: String(page),
          limit: String(limit),
          ...(locationId ? { locationId: String(locationId) } : {}),
          ...(search ? { search: String(search) } : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to fetch inventory counts")
      return (await res.json()) as InventoryCountsResponse
    },
  })
