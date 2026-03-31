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

export type DailySalesSummary = {
  netSales: bigint
  grossSales: bigint
  orderCount: number
  totalTax: bigint
  totalTips: bigint
  totalCollected: bigint
  totalDiscounts: bigint
}

export type MonthlySalesChartRow = {
  month: string
  total: bigint
}
