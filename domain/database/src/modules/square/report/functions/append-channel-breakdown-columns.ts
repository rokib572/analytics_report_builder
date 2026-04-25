import {
  FIELD_LABELS,
  isDerivedLaborMetric,
  isDerivedWasteMetric,
  isLaborMetric,
  isLineItemMetric,
  isWasteMetric,
  type Dimension,
  type Metric,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { buildReportQuery } from "./report-query"

const stringifyKeyPart = (value: string | number | null) =>
  value === null ? "__null__" : String(value)

const buildRowKey = (rowDimensions: Dimension[], row: Record<string, string | number | null>) =>
  rowDimensions
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

const isChannelBreakdownEligible = (metric: Metric): boolean =>
  !isLaborMetric(metric) &&
  !isWasteMetric(metric) &&
  !isLineItemMetric(metric) &&
  !isDerivedLaborMetric(metric) &&
  !isDerivedWasteMetric(metric)

export const appendChannelBreakdownColumns = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportQueryResult> => {
  const requested = (config.channelBreakdownMetrics ?? []).filter(
    (metric) => config.metrics.includes(metric) && isChannelBreakdownEligible(metric),
  )

  if (requested.length === 0) return result

  let working = result

  for (const metric of requested) {
    const metricLabel = FIELD_LABELS[metric] ?? metric

    const breakdownSubConfig: ReportQueryInput = {
      ...config,
      metrics: [metric],
      columns: ["channel"],
      inlineYtdMetrics: undefined,
      channelBreakdownMetrics: undefined,
      locationAttributes: undefined,
      page: 1,
    }

    const breakdownResult = await buildReportQuery(db, customerId, breakdownSubConfig)

    const breakdownMetricColumns = breakdownResult.columns.filter(
      (column): column is Extract<ReportColumn, { kind: "metric" }> =>
        column.kind === "metric" && column.metric === metric && Boolean(column.pivot),
    )

    if (breakdownMetricColumns.length === 0) continue

    const breakdownByRowKey = new Map<string, Record<string, string | number | null>>()
    for (const row of breakdownResult.rows) {
      breakdownByRowKey.set(buildRowKey(config.rows, row), row)
    }

    const baseMetricColumnIndex = working.columns.findIndex(
      (column) => column.kind === "metric" && column.metric === metric && !column.pivot,
    )

    const channelLeafColumns: ReportColumn[] = breakdownMetricColumns.map((subColumn) => {
      const channelValue = subColumn.pivot?.values[0]?.value ?? ""
      return {
        kind: "metric" as const,
        metric,
        key: subColumn.key,
        label: String(channelValue),
        breakdownGroup: metricLabel,
      }
    })

    const existingColumns = [...working.columns]

    if (baseMetricColumnIndex !== -1) {
      const existingBase = existingColumns[baseMetricColumnIndex]!
      if (existingBase.kind === "metric") {
        existingColumns[baseMetricColumnIndex] = {
          ...existingBase,
          label: "Total",
          breakdownGroup: metricLabel,
        }
      }
    }

    const insertIndex =
      baseMetricColumnIndex === -1 ? existingColumns.length : baseMetricColumnIndex

    const nextColumns: ReportColumn[] = [
      ...existingColumns.slice(0, insertIndex),
      ...channelLeafColumns,
      ...existingColumns.slice(insertIndex),
    ]

    const breakdownKeys = channelLeafColumns.map((column) => column.key)

    const nextRows = working.rows.map((row) => {
      const next = { ...row }
      const breakdownRow = breakdownByRowKey.get(buildRowKey(config.rows, row))

      for (const key of breakdownKeys) {
        next[key] = breakdownRow?.[key] ?? null
      }

      return next
    })

    working = { ...working, columns: nextColumns, rows: nextRows }
  }

  return working
}
