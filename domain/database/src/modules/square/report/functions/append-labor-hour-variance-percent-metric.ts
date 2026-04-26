import {
  formatReportColumn,
  type Metric,
  type ReportColumn,
  type ReportQueryResult,
} from "@analytics/report-builder"

const REPORTED_METRIC: Metric = "reportedLaborHours"
const VARIANCE_PERCENT_METRIC: Metric = "laborHourVariancePercent"

export const appendLaborHourVariancePercentMetric = (
  result: ReportQueryResult,
): ReportQueryResult => {
  const reportedColumns = result.columns.filter(
    (column) => column.kind === "metric" && column.metric === REPORTED_METRIC,
  )

  if (reportedColumns.length === 0) return result

  const variancePercentColumns: ReportColumn[] = []
  const keyPairs: Array<{
    reportedKey: string
    templateKey: string
    variancePercentKey: string
  }> = []

  for (const reportedColumn of reportedColumns) {
    if (reportedColumn.kind !== "metric") continue

    const reportedKey = reportedColumn.key
    const templateKey = reportedKey.replace(/reportedLaborHours$/, "templateLaborHours")
    const templateColumn = result.columns.find(
      (column) => column.kind === "metric" && column.key === templateKey,
    )

    if (!templateColumn) continue

    const variancePercentKey = reportedKey.replace(
      /reportedLaborHours$/,
      "laborHourVariancePercent",
    )
    const variancePercentColumn: ReportColumn = {
      kind: "metric",
      key: variancePercentKey,
      metric: VARIANCE_PERCENT_METRIC,
      ...(reportedColumn.pivot ? { pivot: reportedColumn.pivot } : {}),
      label: "",
    }
    variancePercentColumn.label = formatReportColumn(variancePercentColumn)
    variancePercentColumns.push(variancePercentColumn)
    keyPairs.push({ reportedKey, templateKey, variancePercentKey })
  }

  const newRows = result.rows.map((row) => {
    const next = { ...row }
    for (const { reportedKey, templateKey, variancePercentKey } of keyPairs) {
      const reported = Number(row[reportedKey] ?? 0)
      const template = Number(row[templateKey] ?? 0)
      next[variancePercentKey] = template === 0 ? null : (reported / template - 1) * 100
    }
    return next
  })

  return { ...result, columns: [...result.columns, ...variancePercentColumns], rows: newRows }
}
