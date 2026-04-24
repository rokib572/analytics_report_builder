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
  | "reportedLaborHours"
  | "reportedTrainingHours"
  | "estimatedPayrollAfterTax"
  | "costPerLaborHour"
  | "templateLaborHours"
  | "laborHourVariance"
  | "wasteItems"
  | "wasteCost"
  | "wasteCostPctOfSales"

export type LaborMetric =
  | "reportedLaborHours"
  | "reportedTrainingHours"
  | "estimatedPayrollAfterTax"
  | "costPerLaborHour"
  | "templateLaborHours"
  | "laborHourVariance"

export type WasteMetric = "wasteItems" | "wasteCost" | "wasteCostPctOfSales"

export type SupportedMetric = Exclude<Metric, "uberGrossSales" | "uberBogoRecoverable">

export type Dimension =
  | "locationId"
  | "saleDate"
  | "channel"
  | "dayOfWeek"
  | "year"
  | "week"
  | "month"
  | "customer"
  | "product"
  | "productCategory"
  | "paymentMethod"
  | "jobTitle"

export type OrderLevelDimension = "customer" | "product" | "productCategory" | "paymentMethod"
export type LaborLevelDimension = "jobTitle"

export type ComputedDimension = Exclude<
  Dimension,
  "locationId" | "saleDate" | "channel" | OrderLevelDimension | LaborLevelDimension
>

export type ChartType = "bar" | "line" | "table"
export type QueryMode =
  | "dailySales"
  | "lineItems"
  | "tenders"
  | "orders"
  | "labor"
  | "scheduled"
  | "waste"

export type ReportFilter = {
  dimension: Dimension
  operator: "eq" | "in" | "between"
  value: string | string[]
}

export type ReportComparisons = {
  total?: boolean
  previousPeriod?: boolean
  yearOverYear?: boolean
  yearToDate?: boolean
  compingOnly?: boolean
  includeChangePercent?: boolean
  includeYearOverYearChangePercent?: boolean
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
  comparisons?: ReportComparisons
}

export type ReportQueryInput = ReportConfig & {
  page?: number
  pageSize?: number
}

export type PivotCoordinate = {
  values: Array<{ dimension: Dimension; value: string | number }>
}

export type ReportColumn =
  | {
      kind: "dimension"
      key: string
      label: string
      dimension: Dimension
    }
  | {
      kind: "metric"
      key: string
      label: string
      metric: Metric
      pivot?: PivotCoordinate
    }

export type ReportSummaryKind =
  | "total"
  | "comping"
  | "previousPeriod"
  | "yearOverYear"
  | "yearToDate"
  | "changePercent"
  | "yearOverYearChangePercent"

export type ReportSummaryRow = {
  kind: ReportSummaryKind
  label: string
  values: Record<string, string | number | null>
}

export type ReportQueryResult = {
  columns: ReportColumn[]
  rows: Record<string, string | number | null>[]
  generatedAt: string
  page: number
  pageSize: number
  hasMore: boolean
  totalRows?: number
  summaryRows?: ReportSummaryRow[]
}
