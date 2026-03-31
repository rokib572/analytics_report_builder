import type { OrderDto } from "./schema"

export type ListOrdersOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
  state?: string
}

export type ListOrdersResult = {
  orders: OrderDto[]
  totalCount: number
}
