import {
  FIELD_LABELS,
  yearToDateRange,
  type Dimension,
  type Metric,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { buildReportQuery } from "./report-query"

const YTD_KEY_SUFFIX = "__ytd"

const stringifyKeyPart = (value: string | number | null) =>
  value === null ? "__null__" : String(value)

const buildRowKey = (rowDimensions: Dimension[], row: Record<string, string | number | null>) =>
  rowDimensions
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

export const appendInlineYtdColumns = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportQueryResult> => {
  const requestedYtdMetrics = (config.inlineYtdMetrics ?? []).filter((metric) =>
    config.metrics.includes(metric),
  )

  if (requestedYtdMetrics.length === 0) return result
  if (config.rows.length === 0) return result

  const ytdSubConfig: ReportQueryInput = {
    ...config,
    metrics: requestedYtdMetrics,
    columns: [],
    comparisons: undefined,
    inlineYtdMetrics: undefined,
    locationAttributes: undefined,
    dateRange: yearToDateRange(config.dateRange),
    page: 1,
  }

  const ytdResult = await buildReportQuery(db, customerId, ytdSubConfig)

  const ytdByRowKey = new Map<string, Record<string, string | number | null>>()
  for (const row of ytdResult.rows) {
    ytdByRowKey.set(buildRowKey(config.rows, row), row)
  }

  const newColumns: ReportColumn[] = []
  const appendedMetrics = new Set<Metric>()

  for (const column of result.columns) {
    newColumns.push(column)

    if (
      column.kind === "metric" &&
      !column.pivot &&
      column.key === column.metric &&
      requestedYtdMetrics.includes(column.metric) &&
      !appendedMetrics.has(column.metric)
    ) {
      const ytdColumn: ReportColumn = {
        kind: "metric",
        metric: column.metric,
        key: `${column.metric}${YTD_KEY_SUFFIX}`,
        label: `YTD ${FIELD_LABELS[column.metric] ?? column.metric}`,
      }
      newColumns.push(ytdColumn)
      appendedMetrics.add(column.metric)
    }
  }

  for (const metric of requestedYtdMetrics) {
    if (appendedMetrics.has(metric)) continue
    newColumns.push({
      kind: "metric",
      metric,
      key: `${metric}${YTD_KEY_SUFFIX}`,
      label: `YTD ${FIELD_LABELS[metric] ?? metric}`,
    })
    appendedMetrics.add(metric)
  }

  const newRows = result.rows.map((row) => {
    const next = { ...row }
    const ytdRow = ytdByRowKey.get(buildRowKey(config.rows, row))

    for (const metric of requestedYtdMetrics) {
      next[`${metric}${YTD_KEY_SUFFIX}`] = ytdRow?.[metric] ?? null
    }

    return next
  })

  return { ...result, columns: newColumns, rows: newRows }
}
