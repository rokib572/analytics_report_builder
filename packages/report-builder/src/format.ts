import type { Metric, ReportColumn } from "./types"

const MONETARY_COLUMNS = new Set([
  "netSales",
  "grossSales",
  "storeGrossSales",
  "totalDiscounts",
  "totalTax",
  "totalTips",
  "totalCollected",
])

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
}

export const isMonetaryColumn = (column: string) => MONETARY_COLUMNS.has(column)

export const getReportColumnLabel = (column: string) => FIELD_LABELS[column] ?? column

export const getColumnMetric = (column: ReportColumn): Metric | null =>
  column.kind === "metric" ? column.metric : null

export const isMonetaryReportColumn = (column: ReportColumn) => {
  const metric = getColumnMetric(column)
  return metric ? isMonetaryColumn(metric) : false
}

const formatCurrency = (value: string | number | null) => {
  if (value === null) return "$0.00"

  return `$${(Number(value) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatReportColumn = (column: ReportColumn): string => {
  if (column.kind === "dimension") {
    return FIELD_LABELS[column.dimension] ?? column.label
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
  const metric = typeof column === "string" ? (column as Metric | string) : getColumnMetric(column)

  if (metric && isMonetaryColumn(metric)) return formatCurrency(value)

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
  if (metric === "orderCount") return Number(value ?? 0)
  return value
}
