import type { ReportQueryResult } from "@analytics/report-builder"

export const extractSummaryValues = (
  result: ReportQueryResult,
): Record<string, string | number | null> => {
  if (result.rows.length === 0) return {}

  const firstRow = result.rows[0]
  if (!firstRow) return {}

  const values: Record<string, string | number | null> = {}
  for (const column of result.columns) {
    if (column.kind === "metric") {
      values[column.key] = firstRow[column.key] ?? null
    }
  }
  return values
}
