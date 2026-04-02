export type Metric =
  | "netSales"
  | "grossSales"
  | "orderCount"
  | "storeGrossSales"
  | "uberGrossSales"
  | "uberBogoRecoverable"
  | "totalDiscounts"
  | "totalTax"
  | "totalTips"
  | "totalCollected"

export type SupportedMetric = Exclude<Metric, "uberGrossSales" | "uberBogoRecoverable">

export type Dimension =
  | "locationId"
  | "saleDate"
  | "channel"
  | "dayOfWeek"
  | "week"
  | "month"
  | "customer"
  | "product"
  | "paymentMethod"

export type OrderLevelDimension = "customer" | "product" | "paymentMethod"

export type ComputedDimension = Exclude<
  Dimension,
  "locationId" | "saleDate" | "channel" | OrderLevelDimension
>

export type ChartType = "bar" | "line" | "table"

export type ReportFilter = {
  dimension: Dimension
  operator: "eq" | "in" | "between"
  value: string | string[]
}

export type ReportConfig = {
  metrics: Metric[]
  rows: Dimension[]
  columns: Dimension[]
  filters: ReportFilter[]
  chartType: ChartType
  dateRange: {
    from: string
    to: string
  }
}

export type ReportQueryResult = {
  columns: string[]
  rows: Record<string, string | number | null>[]
  generatedAt: string
}
