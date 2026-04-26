import type {
  ExtraColumnDescriptor,
  Metric,
  ReportColumn,
  ReportQueryResult,
} from "@analytics/report-builder"

type MetricColumn = Extract<ReportColumn, { kind: "metric" }>

const INLINE_YTD_SUFFIX = "__ytd"
const COMPARISON_SUFFIX = "__comparison"
const COMPARISON_CHANGE_PCT_SUFFIX = "__comparison_change_pct"
const COMPARISON_YTD_SUFFIX = "__comparison_ytd"
const INLINE_YTD_PRODUCTS_PREFIX = "inline_ytd_products::"

const buildSequence = (
  metricSequence: Metric[],
  extraColumnOrder: ExtraColumnDescriptor[] | undefined,
): ExtraColumnDescriptor[] => {
  const order = extraColumnOrder ?? []
  const presentMetrics = new Set(
    order.filter((entry) => entry.kind === "metric").map((entry) => entry.metric),
  )
  const missingMetrics = metricSequence.filter((metric) => !presentMetrics.has(metric))
  if (missingMetrics.length === 0) return order
  const missingMetricEntries: ExtraColumnDescriptor[] = missingMetrics.map((metric) => ({
    kind: "metric",
    metric,
  }))
  return [...missingMetricEntries, ...order]
}

export const reorderColumnsByMetricSequence = (
  result: ReportQueryResult,
  metricSequence: Metric[],
  extraColumnOrder?: ExtraColumnDescriptor[],
): ReportQueryResult => {
  if (metricSequence.length === 0) return result

  const dimensionColumns: ReportColumn[] = []
  const attributeColumns: ReportColumn[] = []
  const metricColumns: MetricColumn[] = []

  for (const column of result.columns) {
    if (column.kind === "dimension") dimensionColumns.push(column)
    else if (column.kind === "attribute") attributeColumns.push(column)
    else metricColumns.push(column)
  }

  if (metricColumns.some((column) => Boolean(column.pivot))) return result

  const sequence = buildSequence(metricSequence, extraColumnOrder)
  const placed = new Set<string>()
  const orderedColumns: MetricColumn[] = []

  const placeMatching = (matcher: (column: MetricColumn) => boolean) => {
    for (const column of metricColumns) {
      if (placed.has(column.key)) continue
      if (!matcher(column)) continue
      orderedColumns.push(column)
      placed.add(column.key)
    }
  }

  for (const entry of sequence) {
    if (entry.kind === "metric") {
      placeMatching(
        (column) =>
          column.metric === entry.metric &&
          !column.key.startsWith(INLINE_YTD_PRODUCTS_PREFIX) &&
          (column.key === entry.metric || column.breakdownGroup !== undefined),
      )
      continue
    }
    if (entry.kind === "inlineYtd") {
      const expectedKey = `${entry.metric}${INLINE_YTD_SUFFIX}`
      placeMatching((column) => column.key === expectedKey)
      continue
    }
    if (entry.kind === "comparison") {
      const comparisonKey = `${entry.metric}${COMPARISON_SUFFIX}`
      const changePctKey = `${entry.metric}${COMPARISON_CHANGE_PCT_SUFFIX}`
      placeMatching((column) => column.key === comparisonKey)
      placeMatching((column) => column.key === changePctKey)
      continue
    }
    if (entry.kind === "comparisonYtd") {
      const expectedKey = `${entry.metric}${COMPARISON_YTD_SUFFIX}`
      placeMatching((column) => column.key === expectedKey)
      continue
    }
    if (entry.kind === "inlineYtdProducts") {
      placeMatching((column) => column.key.startsWith(INLINE_YTD_PRODUCTS_PREFIX))
      continue
    }
  }

  for (const column of metricColumns) {
    if (placed.has(column.key)) continue
    orderedColumns.push(column)
    placed.add(column.key)
  }

  return {
    ...result,
    columns: [...dimensionColumns, ...orderedColumns, ...attributeColumns],
  }
}
