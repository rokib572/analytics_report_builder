import type { InventoryAdjustmentDto } from "./schema"

export type ListInventoryAdjustmentsOptions = {
  page: number
  limit: number
  locationId?: string
  catalogObjectId?: string
  dateFrom?: string
  dateTo?: string
}

export type ListInventoryAdjustmentsResult = {
  items: InventoryAdjustmentDto[]
  totalCount: number
}
