import type { InventoryCountDto } from "./schema"

export type ListInventoryCountsOptions = {
  page: number
  limit: number
  locationId?: string
  catalogObjectId?: string
  state?: string
}

export type ListInventoryCountsResult = {
  items: InventoryCountDto[]
  totalCount: number
}
