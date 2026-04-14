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

export const SUPPORTED_DIMENSIONS: Exclude<Dimension, "channel">[] = [
  "locationId",
  "saleDate",
  "dayOfWeek",
  "week",
  "month",
  "customer",
  "product",
  "paymentMethod",
]

export const isSupportedMetricValue = (value: string): value is Metric =>
  SUPPORTED_METRICS.includes(value as SupportedMetric)

export const isSupportedDimension = (value: string): value is Exclude<Dimension, "channel"> =>
  SUPPORTED_DIMENSIONS.includes(value as Exclude<Dimension, "channel">)

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
