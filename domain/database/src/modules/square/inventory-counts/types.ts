export type ListInventoryCountsOptions = {
  page: number
  limit: number
  locationId?: string
  search?: string
}

export type InventoryCountListItem = {
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
  calculatedAt: Date
}

export type ListInventoryCountsResult = {
  items: InventoryCountListItem[]
  totalCount: number
}
