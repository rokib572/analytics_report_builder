import type { LocationAttribute, Metric, ReportColumn, ReportSummaryKind } from "./types"

const MONETARY_COLUMNS = new Set([
  "netSales",
  "grossSales",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
  "estimatedPayrollAfterTax",
  "costPerLaborHour",
  "wasteCost",
])

const HOUR_COLUMNS = new Set([
  "reportedLaborHours",
  "reportedTrainingHours",
  "templateLaborHours",
  "laborHourVariance",
])

const PERCENT_COLUMNS = new Set([
  "wasteCostPctOfSales",
  "laborHourVariancePercent",
  "payrollPctOfSales",
  "salesYoyChangePercent",
])

const COUNT_COLUMNS = new Set(["wasteItems", "unitsSold"])

export const FIELD_LABELS: Record<string, string> = {
  netSales: "Net Sales",
  grossSales: "Gross Sales",
  orderCount: "Order Count",
  storeGrossSales: "Store Gross Sales",
  totalDiscounts: "Total Discounts",
  totalTax: "Total Tax",
  totalTips: "Total Tips",
  totalCollected: "Total Collected",
  reportedLaborHours: "Reported Labor Hours",
  reportedTrainingHours: "Reported Training Hours",
  estimatedPayrollAfterTax: "Estimated Payroll (After Tax)",
  costPerLaborHour: "Cost per Labor Hour",
  templateLaborHours: "Template Labor Hours",
  laborHourVariance: "Labor Hour Variance",
  laborHourVariancePercent: "Labor Hour Variance %",
  payrollPctOfSales: "Payroll % of Sales",
  wasteItems: "Waste Items",
  wasteCost: "Waste Cost",
  wasteCostPctOfSales: "Waste % of Sales",
  unitsSold: "Units Sold",
  salesYoyChangePercent: "YOY Sales Change (%)",
  daysOpen: "Days Open",
  dateOpened: "Date Opened",
  locationId: "Location",
  locationName: "Location Name",
  saleDate: "Sale Date",
  dayOfWeek: "Day of Week",
  year: "Year",
  week: "Week",
  month: "Month",
  customer: "Customer",
  product: "Product",
  productCategory: "Product Category",
  paymentMethod: "Payment Method",
  channel: "Channel",
  jobTitle: "Job Title",
}

export const isMonetaryColumn = (column: string) => MONETARY_COLUMNS.has(column)

export const isHourColumn = (column: string) => HOUR_COLUMNS.has(column)

export const isPercentColumn = (column: string) => PERCENT_COLUMNS.has(column)

export const isCountColumn = (column: string) => COUNT_COLUMNS.has(column)

export const getReportColumnLabel = (column: string) => FIELD_LABELS[column] ?? column

export const getColumnMetric = (column: ReportColumn): Metric | null =>
  column.kind === "metric" ? column.metric : null

export const getColumnAttribute = (column: ReportColumn): LocationAttribute | null =>
  column.kind === "attribute" ? column.attribute : null

export const isMonetaryReportColumn = (column: ReportColumn) => {
  const metric = getColumnMetric(column)
  return metric ? isMonetaryColumn(metric) : false
}

const MILLI_HOURS_PER_HOUR = 1000

const formatCurrency = (value: string | number | null) => {
  if (value === null) return "$0.00"

  return `$${(Number(value) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatHours = (value: string | number | null) => {
  if (value === null) return "0.00"

  return (Number(value) / MILLI_HOURS_PER_HOUR).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatPercent = (value: string | number | null) => {
  if (value === null) return "-"

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return "-"

  return `${numericValue.toFixed(1)}%`
}

const formatCount = (value: string | number | null) => {
  if (value === null) return "0"

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })
}

export const formatReportColumn = (column: ReportColumn): string => {
  if (column.kind === "dimension") {
    return FIELD_LABELS[column.dimension] ?? column.label
  }

  if (column.kind === "attribute") {
    return FIELD_LABELS[column.attribute] ?? column.label
  }

  if (!column.pivot) {
    return FIELD_LABELS[column.metric] ?? column.label
  }

  const pivotLabel = column.pivot.values
    .map(({ dimension, value }) => formatReportCell(dimension, value))
    .join(" · ")

  return `${pivotLabel} — ${FIELD_LABELS[column.metric] ?? column.label}`
}

export function formatReportCell(column: string, value: string | number | null): string
export function formatReportCell(column: ReportColumn, value: string | number | null): string
export function formatReportCell(
  column: string | ReportColumn,
  value: string | number | null,
): string
export function formatReportCell(column: string | ReportColumn, value: string | number | null) {
  const attribute = typeof column === "string" ? null : getColumnAttribute(column)

  if (attribute === "daysOpen") {
    if (value === null) return "-"
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })
  }

  if (attribute === "dateOpened") {
    return value === null ? "-" : String(value)
  }

  const metric = typeof column === "string" ? (column as Metric | string) : getColumnMetric(column)

  if (metric && isMonetaryColumn(metric)) return formatCurrency(value)
  if (metric && isHourColumn(metric)) return formatHours(value)
  if (metric && isPercentColumn(metric)) return formatPercent(value)
  if (metric && isCountColumn(metric)) return formatCount(value)

  if (metric === "orderCount") {
    return Number(value ?? 0).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  }

  return value === null ? "-" : String(value)
}

export const getChartValue = (column: string | ReportColumn, value: string | number | null) => {
  const metric = typeof column === "string" ? (column as Metric | string) : getColumnMetric(column)

  if (metric && isMonetaryColumn(metric)) return Number(value ?? 0) / 100
  if (metric && isHourColumn(metric)) return Number(value ?? 0) / MILLI_HOURS_PER_HOUR
  if (metric && isPercentColumn(metric)) return Number(value ?? 0)
  if (metric && isCountColumn(metric)) return Number(value ?? 0)
  if (metric === "orderCount") return Number(value ?? 0)
  return value
}

export const isPercentSummaryKind = (kind: ReportSummaryKind): boolean =>
  kind === "changePercent" || kind === "yearOverYearChangePercent"

const formatSignedPercentage = (value: string | number | null): string => {
  if (value === null || value === undefined || value === "") return "-"

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return "-"

  const signPrefix = numericValue > 0 ? "+" : ""
  return `${signPrefix}${numericValue.toFixed(1)}%`
}

export const formatSummaryCell = (
  kind: ReportSummaryKind,
  column: ReportColumn,
  value: string | number | null,
): string => {
  if (isPercentSummaryKind(kind)) return formatSignedPercentage(value)
  return formatReportCell(column, value)
}
