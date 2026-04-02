import type { Dimension, Metric, ReportConfig, SupportedMetric } from "@analytics/report-builder"

export const FIELD_LABELS: Record<string, string> = {
  netSales: "Net Sales",
  grossSales: "Gross Sales",
  orderCount: "Order Count",
  storeGrossSales: "Store Gross Sales",
  totalDiscounts: "Total Discounts",
  totalTax: "Total Tax",
  totalTips: "Total Tips",
  totalCollected: "Total Collected",
  locationId: "Location",
  saleDate: "Sale Date",
  dayOfWeek: "Day of Week",
  week: "Week",
  month: "Month",
  customer: "Customer",
  product: "Product",
  paymentMethod: "Payment Method",
}

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
