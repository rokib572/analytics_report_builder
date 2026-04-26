import {
  FIELD_LABELS,
  type Dimension,
  type FilterDimension,
  type FilterMetric,
  type Metric,
  type ReportConfig,
  type SupportedMetric,
} from "@analytics/report-builder"

export const FILTER_DIMENSIONS: FilterDimension[] = [
  "locationId",
  "channel",
  "customer",
  "product",
  "productCategory",
]

export const FILTER_METRICS: FilterMetric[] = [
  "netSales",
  "reportedLaborHours",
  "estimatedPayrollAfterTax",
]

export const FILTER_METRIC_LABELS: Record<FilterMetric, string> = {
  netSales: "Net Sales",
  reportedLaborHours: "Reported Labor Hours",
  estimatedPayrollAfterTax: "Estimated Salary",
}

export const isMonetaryFilterMetric = (metric: FilterMetric): boolean =>
  metric === "netSales" || metric === "estimatedPayrollAfterTax"

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

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// ISO week: Monday is the first day. Returns the Monday on or before the given date.
const startOfIsoWeek = (date: Date): Date => {
  const result = new Date(date)
  const dayOfWeek = result.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  result.setDate(result.getDate() - daysSinceMonday)
  return result
}

export const getDefaultDateRange = (): ReportConfig["dateRange"] => {
  const today = new Date()
  const from = new Date()
  from.setDate(today.getDate() - 30)

  return {
    from: toIsoDate(from),
    to: toIsoDate(today),
  }
}

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom" },
] as const

export type DatePreset = (typeof DATE_PRESETS)[number]["value"]

export const getDateRangeForPreset = (preset: DatePreset): ReportConfig["dateRange"] | null => {
  if (preset === "custom") return null

  const today = new Date()

  if (preset === "today") {
    return { from: toIsoDate(today), to: toIsoDate(today) }
  }

  if (preset === "yesterday") {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return { from: toIsoDate(yesterday), to: toIsoDate(yesterday) }
  }

  if (preset === "thisWeek") {
    const weekStart = startOfIsoWeek(today)
    return { from: toIsoDate(weekStart), to: toIsoDate(today) }
  }

  if (preset === "lastWeek") {
    const thisWeekStart = startOfIsoWeek(today)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1)
    return { from: toIsoDate(lastWeekStart), to: toIsoDate(lastWeekEnd) }
  }

  if (preset === "thisMonth") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toIsoDate(monthStart), to: toIsoDate(today) }
  }

  if (preset === "lastMonth") {
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: toIsoDate(lastMonthStart), to: toIsoDate(lastMonthEnd) }
  }

  if (preset === "thisYear") {
    const yearStart = new Date(today.getFullYear(), 0, 1)
    return { from: toIsoDate(yearStart), to: toIsoDate(today) }
  }

  if (preset === "lastYear") {
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)
    return { from: toIsoDate(lastYearStart), to: toIsoDate(lastYearEnd) }
  }

  return null
}

export { FIELD_LABELS }
