import {
  FIELD_LABELS,
  yearToDateRange,
  type Dimension,
  type ExtraColumnDescriptor,
  type ExtraColumnKind,
  type Metric,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { buildReportQuery } from "./report-query"

const INLINE_YTD_KEY_SUFFIX = "__ytd"
const COMPARISON_KEY_SUFFIX = "__comparison"
const COMPARISON_YTD_KEY_SUFFIX = "__comparison_ytd"
const COMPARISON_CHANGE_PCT_KEY_SUFFIX = "__comparison_change_pct"
const SALES_YOY_CHANGE_LABEL = "YOY Sales Change (%)"
const PRODUCT_YTD_BREAKDOWN_LABEL = "YTD Products"
const PRODUCT_YTD_PSEUDO_METRIC: Metric = "unitsSold"

const DEFAULT_COMPARISON_LABELS: Partial<Record<Metric, { priorPeriod: string; ytd: string }>> = {
  netSales: { priorPeriod: "PY Comping Sales", ytd: "Comping Sales YTD" },
}

const stringifyKeyPart = (value: string | number | null) =>
  value === null ? "__null__" : String(value)

const buildRowKey = (rowDimensions: Dimension[], row: Record<string, string | number | null>) =>
  rowDimensions
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

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

const buildPriorComparisonLabel = (metric: Metric, override: string | undefined): string => {
  if (override) return override
  const domainDefault = DEFAULT_COMPARISON_LABELS[metric]
  if (domainDefault) return domainDefault.priorPeriod
  const metricLabel = FIELD_LABELS[metric] ?? metric
  return `PY ${metricLabel}`
}

const buildYtdComparisonLabel = (metric: Metric): string => {
  const domainDefault = DEFAULT_COMPARISON_LABELS[metric]
  if (domainDefault) return domainDefault.ytd
  const metricLabel = FIELD_LABELS[metric] ?? metric
  return `${metricLabel} YTD`
}

const buildInlineYtdLabel = (metric: Metric): string => `YTD ${FIELD_LABELS[metric] ?? metric}`

const buildYoyChangeLabel = (metric: Metric): string => {
  if (metric === "netSales") return SALES_YOY_CHANGE_LABEL
  const metricLabel = FIELD_LABELS[metric] ?? metric
  return `YOY ${metricLabel} Change (%)`
}

const dedupeDescriptors = (descriptors: ExtraColumnDescriptor[]): ExtraColumnDescriptor[] => {
  const seen = new Set<string>()
  const result: ExtraColumnDescriptor[] = []
  for (const descriptor of descriptors) {
    const key = `${descriptor.kind}:${descriptor.metric}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(descriptor)
  }
  return result
}

const deriveDescriptorsFromLegacy = (config: ReportQueryInput): ExtraColumnDescriptor[] => {
  const descriptors: ExtraColumnDescriptor[] = []
  for (const metric of config.inlineYtdMetrics ?? []) {
    descriptors.push({ kind: "inlineYtd", metric })
  }
  for (const metric of config.comparisonMetrics ?? []) {
    descriptors.push({ kind: "comparison", metric })
  }
  for (const metric of config.comparisonYtdMetrics ?? []) {
    descriptors.push({ kind: "comparisonYtd", metric })
  }
  for (const metric of config.comparisonYoyMetrics ?? []) {
    descriptors.push({ kind: "comparisonYoy", metric })
  }
  if (config.inlineYtdProducts) {
    descriptors.push({ kind: "inlineYtdProducts", metric: PRODUCT_YTD_PSEUDO_METRIC })
  }
  return descriptors
}

const filterDescriptorsBySupport = (
  descriptors: ExtraColumnDescriptor[],
  config: ReportQueryInput,
): ExtraColumnDescriptor[] => {
  const baseMetrics = new Set<Metric>(config.metrics)
  const comparisonMetricsByDescriptor = new Set<Metric>()
  const filtered: ExtraColumnDescriptor[] = []

  for (const descriptor of descriptors) {
    if (descriptor.kind === "metric") continue
    if (descriptor.kind === "inlineYtdProducts") {
      if (config.rows.length === 0) continue
      filtered.push(descriptor)
      continue
    }
    if (!baseMetrics.has(descriptor.metric)) continue
    if (descriptor.kind === "inlineYtd") {
      if (config.rows.length === 0) continue
      filtered.push(descriptor)
      continue
    }
    if (descriptor.kind === "comparison") {
      if (!config.comparisonDateRange) continue
      filtered.push(descriptor)
      comparisonMetricsByDescriptor.add(descriptor.metric)
      continue
    }
    if (descriptor.kind === "comparisonYtd") {
      if (!config.comparisonDateRange) continue
      if (!comparisonMetricsByDescriptor.has(descriptor.metric)) continue
      filtered.push(descriptor)
      continue
    }
    if (descriptor.kind === "comparisonYoy") {
      if (!config.comparisonDateRange) continue
      if (!comparisonMetricsByDescriptor.has(descriptor.metric)) continue
      filtered.push(descriptor)
    }
  }

  return filtered
}

const buildSubConfig = (
  config: ReportQueryInput,
  metrics: Metric[],
  dateRange: { from: string; to: string },
): ReportQueryInput => ({
  ...config,
  metrics,
  columns: [],
  inlineYtdMetrics: undefined,
  channelBreakdownMetrics: undefined,
  comparisonDateRange: undefined,
  comparisonMetrics: undefined,
  comparisonYtdMetrics: undefined,
  comparisonYoyMetrics: undefined,
  extraColumnOrder: undefined,
  inlineYtdProducts: undefined,
  locationAttributes: undefined,
  dateRange,
  page: 1,
})

const fetchRowsByKey = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  metrics: Metric[],
  dateRange: { from: string; to: string },
): Promise<Map<string, Record<string, string | number | null>>> => {
  const subResult = await buildReportQuery(
    db,
    customerId,
    buildSubConfig(config, metrics, dateRange),
  )
  const byRowKey = new Map<string, Record<string, string | number | null>>()
  for (const row of subResult.rows) {
    byRowKey.set(buildRowKey(config.rows, row), row)
  }
  return byRowKey
}

const collectMetricsByKind = (
  descriptors: ExtraColumnDescriptor[],
): Record<ExtraColumnKind, Metric[]> => {
  const buckets: Record<ExtraColumnKind, Metric[]> = {
    metric: [],
    inlineYtd: [],
    comparison: [],
    comparisonYtd: [],
    comparisonYoy: [],
    inlineYtdProducts: [],
  }
  for (const descriptor of descriptors) {
    if (!buckets[descriptor.kind].includes(descriptor.metric)) {
      buckets[descriptor.kind].push(descriptor.metric)
    }
  }
  return buckets
}

const fetchProductYtdRowsByKey = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
): Promise<{
  rowMap: Map<string, Record<string, string | number | null>>
  productColumns: Array<Extract<ReportColumn, { kind: "metric" }>>
}> => {
  const subResult = await buildReportQuery(db, customerId, {
    ...buildSubConfig(config, [PRODUCT_YTD_PSEUDO_METRIC], yearToDateRange(config.dateRange)),
    columns: ["product"],
  })

  const productColumns = subResult.columns.filter(
    (column): column is Extract<ReportColumn, { kind: "metric" }> =>
      column.kind === "metric" &&
      column.metric === PRODUCT_YTD_PSEUDO_METRIC &&
      Boolean(column.pivot),
  )

  const rowMap = new Map<string, Record<string, string | number | null>>()
  for (const row of subResult.rows) {
    rowMap.set(buildRowKey(config.rows, row), row)
  }

  return { rowMap, productColumns }
}

export const appendExtraColumns = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
  result: ReportQueryResult,
): Promise<ReportQueryResult> => {
  const orderedDescriptors = config.extraColumnOrder?.length
    ? dedupeDescriptors(config.extraColumnOrder)
    : dedupeDescriptors(deriveDescriptorsFromLegacy(config))

  const supportedDescriptors = filterDescriptorsBySupport(orderedDescriptors, config)
  if (supportedDescriptors.length === 0) return result

  const buckets = collectMetricsByKind(supportedDescriptors)

  const inlineYtdRowsByKey =
    buckets.inlineYtd.length > 0
      ? await fetchRowsByKey(
          db,
          customerId,
          config,
          buckets.inlineYtd,
          yearToDateRange(config.dateRange),
        )
      : null

  const comparisonMetricsToFetch = [...new Set([...buckets.comparison, ...buckets.comparisonYoy])]
  const comparisonRowsByKey =
    comparisonMetricsToFetch.length > 0 && config.comparisonDateRange
      ? await fetchRowsByKey(
          db,
          customerId,
          config,
          comparisonMetricsToFetch,
          config.comparisonDateRange,
        )
      : null

  const comparisonYtdRowsByKey =
    buckets.comparisonYtd.length > 0 && config.comparisonDateRange
      ? await fetchRowsByKey(
          db,
          customerId,
          config,
          buckets.comparisonYtd,
          yearToDateRange(config.comparisonDateRange),
        )
      : null

  const productYtdData =
    buckets.inlineYtdProducts.length > 0
      ? await fetchProductYtdRowsByKey(db, customerId, config)
      : null

  const newColumns: ReportColumn[] = []
  const writeRowEntries: Array<{
    columnKey: string
    metric: Metric
    sourceKey?: string
    sourceMap: Map<string, Record<string, string | number | null>> | null
    derivePercent?: { fromKey: string }
    derivePercentFromCurrent?: boolean
  }> = []

  for (const descriptor of supportedDescriptors) {
    const labelOverride = config.comparisonMetricLabels?.[descriptor.metric]

    if (descriptor.kind === "inlineYtdProducts") {
      if (!productYtdData) continue
      for (const productColumn of productYtdData.productColumns) {
        const productLabel = String(productColumn.pivot?.values[0]?.value ?? productColumn.label)
        const columnKey = `inline_ytd_products::${productColumn.key}`
        newColumns.push({
          kind: "metric",
          metric: PRODUCT_YTD_PSEUDO_METRIC,
          key: columnKey,
          label: productLabel,
          breakdownGroup: PRODUCT_YTD_BREAKDOWN_LABEL,
        })
        writeRowEntries.push({
          columnKey,
          metric: PRODUCT_YTD_PSEUDO_METRIC,
          sourceKey: productColumn.key,
          sourceMap: productYtdData.rowMap,
        })
      }
      continue
    }

    if (descriptor.kind === "inlineYtd") {
      const columnKey = `${descriptor.metric}${INLINE_YTD_KEY_SUFFIX}`
      newColumns.push({
        kind: "metric",
        metric: descriptor.metric,
        key: columnKey,
        label: buildInlineYtdLabel(descriptor.metric),
      })
      writeRowEntries.push({
        columnKey,
        metric: descriptor.metric,
        sourceMap: inlineYtdRowsByKey,
      })
      continue
    }

    if (descriptor.kind === "comparison") {
      const columnKey = `${descriptor.metric}${COMPARISON_KEY_SUFFIX}`
      newColumns.push({
        kind: "metric",
        metric: descriptor.metric,
        key: columnKey,
        label: buildPriorComparisonLabel(descriptor.metric, labelOverride),
      })
      writeRowEntries.push({
        columnKey,
        metric: descriptor.metric,
        sourceMap: comparisonRowsByKey,
      })
      continue
    }

    if (descriptor.kind === "comparisonYoy") {
      const columnKey = `${descriptor.metric}${COMPARISON_CHANGE_PCT_KEY_SUFFIX}`
      newColumns.push({
        kind: "metric",
        metric: "salesYoyChangePercent",
        key: columnKey,
        label: buildYoyChangeLabel(descriptor.metric),
      })
      writeRowEntries.push({
        columnKey,
        metric: descriptor.metric,
        sourceMap: comparisonRowsByKey,
        derivePercentFromCurrent: true,
      })
      continue
    }

    const columnKey = `${descriptor.metric}${COMPARISON_YTD_KEY_SUFFIX}`
    newColumns.push({
      kind: "metric",
      metric: descriptor.metric,
      key: columnKey,
      label: buildYtdComparisonLabel(descriptor.metric),
    })
    writeRowEntries.push({
      columnKey,
      metric: descriptor.metric,
      sourceMap: comparisonYtdRowsByKey,
    })
  }

  const nextRows = result.rows.map((row) => {
    const next = { ...row }
    const rowKey = buildRowKey(config.rows, row)
    for (const entry of writeRowEntries) {
      if (entry.derivePercent) {
        next[entry.columnKey] = computeYoyChangePercent(
          row[entry.metric],
          next[entry.derivePercent.fromKey] ?? null,
        )
        continue
      }
      if (entry.derivePercentFromCurrent) {
        const sourceRow = entry.sourceMap?.get(rowKey)
        const priorValue = sourceRow?.[entry.metric] ?? null
        next[entry.columnKey] = computeYoyChangePercent(row[entry.metric], priorValue)
        continue
      }
      const sourceRow = entry.sourceMap?.get(rowKey)
      const lookupKey = entry.sourceKey ?? entry.metric
      next[entry.columnKey] = sourceRow?.[lookupKey] ?? null
    }
    return next
  })

  return {
    ...result,
    columns: [...result.columns, ...newColumns],
    rows: nextRows,
  }
}
