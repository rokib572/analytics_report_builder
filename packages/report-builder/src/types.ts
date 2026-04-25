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
  | "laborHourVariancePercent"
  | "payrollPctOfSales"
  | "wasteItems"
  | "wasteCost"
  | "wasteCostPctOfSales"
  | "unitsSold"
  | "salesYoyChangePercent"

export type LineItemsMetric = "unitsSold"

export type LaborMetric =
  | "reportedLaborHours"
  | "reportedTrainingHours"
  | "estimatedPayrollAfterTax"
  | "costPerLaborHour"
  | "templateLaborHours"
  | "laborHourVariance"
  | "laborHourVariancePercent"
  | "payrollPctOfSales"

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

export type LocationAttribute = "daysOpen" | "dateOpened"

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

export type ExtraColumnKind = "inlineYtd" | "comparison" | "comparisonYtd"

export type ExtraColumnDescriptor = {
  kind: ExtraColumnKind
  metric: Metric
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
  locationAttributes?: LocationAttribute[]
  inlineYtdMetrics?: Metric[]
  channelBreakdownMetrics?: Metric[]
  comparisonDateRange?: { from: string; to: string }
  comparisonMetrics?: Metric[]
  comparisonYtdMetrics?: Metric[]
  comparisonMetricLabels?: Record<string, string>
  extraColumnOrder?: ExtraColumnDescriptor[]
  payrollTaxRatePercent?: number
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
      breakdownGroup?: string
    }
  | {
      kind: "attribute"
      key: string
      label: string
      attribute: LocationAttribute
    }

export type ReportQueryResult = {
  columns: ReportColumn[]
  rows: Record<string, string | number | null>[]
  generatedAt: string
  page: number
  pageSize: number
  hasMore: boolean
  totalRows?: number
}
