import {
  formatReportColumn,
  type Metric,
  type ReportColumn,
  type ReportQueryResult,
} from "@analytics/report-builder"

const PAYROLL_METRIC: Metric = "estimatedPayrollAfterTax"
const PAYROLL_PCT_METRIC: Metric = "payrollPctOfSales"

export const appendPayrollPctOfSalesMetric = (result: ReportQueryResult): ReportQueryResult => {
  const payrollColumns = result.columns.filter(
    (column) => column.kind === "metric" && column.metric === PAYROLL_METRIC,
  )

  if (payrollColumns.length === 0) return result

  const pctColumns: ReportColumn[] = []
  const keyPairs: Array<{
    payrollKey: string
    netSalesKey: string
    pctKey: string
  }> = []

  for (const payrollColumn of payrollColumns) {
    if (payrollColumn.kind !== "metric") continue

    const payrollKey = payrollColumn.key
    const netSalesKey = payrollKey.replace(/estimatedPayrollAfterTax$/, "netSales")
    const netSalesColumn = result.columns.find(
      (column) => column.kind === "metric" && column.key === netSalesKey,
    )

    if (!netSalesColumn) continue

    const pctKey = payrollKey.replace(/estimatedPayrollAfterTax$/, "payrollPctOfSales")
    const pctColumn: ReportColumn = {
      kind: "metric",
      key: pctKey,
      metric: PAYROLL_PCT_METRIC,
      ...(payrollColumn.pivot ? { pivot: payrollColumn.pivot } : {}),
      label: "",
    }
    pctColumn.label = formatReportColumn(pctColumn)
    pctColumns.push(pctColumn)
    keyPairs.push({ payrollKey, netSalesKey, pctKey })
  }

  const newRows = result.rows.map((row) => {
    const next = { ...row }
    for (const { payrollKey, netSalesKey, pctKey } of keyPairs) {
      const payroll = Number(row[payrollKey] ?? 0)
      const netSales = Number(row[netSalesKey] ?? 0)
      next[pctKey] = netSales === 0 ? null : (payroll / netSales) * 100
    }
    return next
  })

  return { ...result, columns: [...result.columns, ...pctColumns], rows: newRows }
}
