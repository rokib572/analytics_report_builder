import {
  FIELD_LABELS,
  type Dimension,
  type Metric,
  type ReportConfig,
  type SupportedMetric,
} from "@analytics/report-builder"

export const SUPPORTED_METRICS: SupportedMetric[] = [
  "netSales",
  "grossSales",
  "orderCount",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
]

export const SUPPORTED_DIMENSIONS: Dimension[] = [
  "locationId",
  "saleDate",
  "dayOfWeek",
  "year",
  "week",
  "month",
  "channel",
  "customer",
  "product",
  "productCategory",
  "paymentMethod",
]

export const isSupportedMetricValue = (value: string): value is Metric =>
  SUPPORTED_METRICS.includes(value as SupportedMetric)

export const isSupportedDimension = (value: string): value is Dimension =>
  SUPPORTED_DIMENSIONS.includes(value as Dimension)

export const getDefaultDateRange = (): ReportConfig["dateRange"] => {
  const today = new Date()
  const from = new Date()
  from.setDate(today.getDate() - 30)

  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  }
}

export { FIELD_LABELS }
