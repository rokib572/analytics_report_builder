import type { DailySalesDto } from "./schema"

export type ListDailySalesOptions = {
  locationId: string
  page: number
  limit: number
  dateFrom?: string
  dateTo?: string
}

export type ListDailySalesResult = {
  dailySales: DailySalesDto[]
  totalCount: number
}
