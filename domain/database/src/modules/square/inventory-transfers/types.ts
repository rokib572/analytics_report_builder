import type { InventoryTransferDto } from "./schema"

export type ListInventoryTransfersOptions = {
  page: number
  limit: number
  catalogObjectId?: string
  fromLocationId?: string
  toLocationId?: string
  dateFrom?: string
  dateTo?: string
}

export type ListInventoryTransfersResult = {
  items: InventoryTransferDto[]
  totalCount: number
}
