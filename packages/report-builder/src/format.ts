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
  week: "Week",
  month: "Month",
  customer: "Customer",
  product: "Product",
  paymentMethod: "Payment Method",
}

export const isMonetaryColumn = (column: string) => MONETARY_COLUMNS.has(column)

export const getReportColumnLabel = (column: string) => FIELD_LABELS[column] ?? column

const formatCurrency = (value: string | number | null) => {
  if (value === null) return "$0.00"

  return `$${(Number(value) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatReportCell = (column: string, value: string | number | null) => {
  if (isMonetaryColumn(column)) return formatCurrency(value)

  if (column === "orderCount") {
    return Number(value ?? 0).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  }

  return value === null ? "-" : String(value)
}

export const getChartValue = (column: string, value: string | number | null) => {
  if (isMonetaryColumn(column)) return Number(value ?? 0) / 100
  if (column === "orderCount") return Number(value ?? 0)
  return value
}
