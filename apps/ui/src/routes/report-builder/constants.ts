import {
  FIELD_LABELS,
  type Dimension,
  type Metric,
  type ReportConfig,
  type SupportedMetric,
} from "@analytics/report-builder"

export const SALES_METRICS: SupportedMetric[] = [
  "netSales",
  "grossSales",
  "orderCount",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
  "unitsSold",
]

export const LABOR_METRICS: SupportedMetric[] = [
  "reportedLaborHours",
  "templateLaborHours",
  "laborHourVariance",
  "laborHourVariancePercent",
  "reportedTrainingHours",
  "estimatedPayrollAfterTax",
  "payrollPctOfSales",
  "costPerLaborHour",
]

export const WASTE_METRICS: SupportedMetric[] = ["wasteItems", "wasteCost", "wasteCostPctOfSales"]

export const SUPPORTED_METRICS: SupportedMetric[] = [
  ...SALES_METRICS,
  ...LABOR_METRICS,
  ...WASTE_METRICS,
]

export const METRIC_GROUPS: Array<{ label: string; metrics: SupportedMetric[] }> = [
  { label: "Sales", metrics: SALES_METRICS },
  { label: "Labor", metrics: LABOR_METRICS },
  { label: "Waste", metrics: WASTE_METRICS },
]

// `channel` is intentionally omitted from the user-draggable dimension list.
// Channel-awareness is surfaced as a per-metric "Break down by channel" toggle
// (see ReportCanvas). `channel` remains a valid internal Dimension — preset
// filters and the channel-breakdown sub-query still reference it.
export const SUPPORTED_DIMENSIONS: Dimension[] = [
  "locationId",
  "saleDate",
  "dayOfWeek",
  "year",
  "week",
  "month",
  "customer",
  "product",
  "productCategory",
  "paymentMethod",
  "jobTitle",
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
