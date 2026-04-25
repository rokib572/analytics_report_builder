import {
  FIELD_LABELS,
  type Dimension,
  type Metric,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { buildReportQuery } from "./report-query"

const COMPARISON_KEY_SUFFIX = "__comparison"
const COMPARISON_CHANGE_PCT_KEY_SUFFIX = "__comparison_change_pct"
const SALES_YOY_CHANGE_LABEL = "YOY Sales Change (%)"

const computeYoyChangePercent = (
  currentValue: string | number | null | undefined,
  priorValue: string | number | null | undefined,
): number | null => {
  if (currentValue === null || currentValue === undefined) return null
  if (priorValue === null || priorValue === undefined) return null
  const priorNumeric = Number(priorValue)
  if (!Number.isFinite(priorNumeric) || priorNumeric === 0) return null
  const currentNumeric = Number(currentValue)
  if (!Number.isFinite(currentNumeric)) return null
  return ((currentNumeric - priorNumeric) / priorNumeric) * 100
}

const stringifyKeyPart = (value: string | number | null) =>
  value === null ? "__null__" : String(value)

const buildRowKey = (rowDimensions: Dimension[], row: Record<string, string | number | null>) =>
  rowDimensions
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

const DEFAULT_COMPARISON_LABELS: Partial<Record<Metric, string>> = {
  netSales: "PY Comping Sales",
}

const buildComparisonLabel = (metric: Metric, override: string | undefined): string => {
  if (override) return override
  const domainDefault = DEFAULT_COMPARISON_LABELS[metric]
  if (domainDefault) return domainDefault
  const metricLabel = FIELD_LABELS[metric] ?? metric
  return `PY ${metricLabel}`
}

export const appendComparisonColumns = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportQueryResult> => {
  const comparisonRange = config.comparisonDateRange
  if (!comparisonRange) return result

  const requested = (config.comparisonMetrics ?? []).filter((metric) =>
    config.metrics.includes(metric),
  )
  if (requested.length === 0) return result

  let working = result

  for (const metric of requested) {
    const subConfig: ReportQueryInput = {
      ...config,
      metrics: [metric],
      columns: [],
      comparisons: undefined,
      inlineYtdMetrics: undefined,
      channelBreakdownMetrics: undefined,
      comparisonDateRange: undefined,
      comparisonMetrics: undefined,
      locationAgePartition: undefined,
      locationAttributes: undefined,
      dateRange: comparisonRange,
      page: 1,
    }

    const subResult = await buildReportQuery(db, customerId, subConfig)

    const byRowKey = new Map<string, Record<string, string | number | null>>()
    for (const row of subResult.rows) {
      byRowKey.set(buildRowKey(config.rows, row), row)
    }

    const comparisonKey = `${metric}${COMPARISON_KEY_SUFFIX}`
    const labelOverride = config.comparisonMetricLabels?.[metric]
    const comparisonLabel = buildComparisonLabel(metric, labelOverride)

    const baseMetricColumnIndex = working.columns.findIndex(
      (column) =>
        column.kind === "metric" &&
        column.metric === metric &&
        !column.pivot &&
        column.key === metric,
    )
    const insertIndex =
      baseMetricColumnIndex === -1 ? working.columns.length : baseMetricColumnIndex + 1

    const comparisonColumn: ReportColumn = {
      kind: "metric",
      metric,
      key: comparisonKey,
      label: comparisonLabel,
    }

    const includeYoyChangeColumn = metric === "netSales"
    const changePercentKey = includeYoyChangeColumn
      ? `${metric}${COMPARISON_CHANGE_PCT_KEY_SUFFIX}`
      : null
    const changePercentColumn: ReportColumn | null = changePercentKey
      ? {
          kind: "metric",
          metric: "salesYoyChangePercent",
          key: changePercentKey,
          label: SALES_YOY_CHANGE_LABEL,
        }
      : null

    const insertedColumns: ReportColumn[] = changePercentColumn
      ? [comparisonColumn, changePercentColumn]
      : [comparisonColumn]

    const nextColumns: ReportColumn[] = [
      ...working.columns.slice(0, insertIndex),
      ...insertedColumns,
      ...working.columns.slice(insertIndex),
    ]

    const nextRows = working.rows.map((row) => {
      const next = { ...row }
      const subRow = byRowKey.get(buildRowKey(config.rows, row))
      const priorValue = subRow?.[metric] ?? null
      next[comparisonKey] = priorValue
      if (changePercentKey) {
        next[changePercentKey] = computeYoyChangePercent(row[metric], priorValue)
      }
      return next
    })

    const nextSections = working.sections?.map((section) => ({
      ...section,
      rows: section.rows.map((row) => {
        const next = { ...row }
        const subRow = byRowKey.get(buildRowKey(config.rows, row))
        const priorValue = subRow?.[metric] ?? null
        next[comparisonKey] = priorValue
        if (changePercentKey) {
          next[changePercentKey] = computeYoyChangePercent(row[metric], priorValue)
        }
        return next
      }),
    }))

    working = {
      ...working,
      columns: nextColumns,
      rows: nextRows,
      ...(nextSections ? { sections: nextSections } : {}),
    }
  }

  return working
}
