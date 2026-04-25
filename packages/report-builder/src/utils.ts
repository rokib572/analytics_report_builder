import { DomainError } from "@analytics/shared-libs"
import type {
  ComputedDimension,
  Dimension,
  LaborMetric,
  LineItemsMetric,
  Metric,
  OrderLevelDimension,
  PivotCoordinate,
  QueryMode,
  ReportColumn,
  ReportConfig,
  SupportedMetric,
  WasteMetric,
} from "./types"
import { formatReportColumn } from "./format"

const unsupportedMetrics = new Set<Metric>(["uberGrossSales", "uberBogoRecoverable"])
const unsupportedDimensions = new Set<Dimension>([])
const orderLevelDimensions = new Set<OrderLevelDimension>([
  "customer",
  "product",
  "productCategory",
  "paymentMethod",
])
const laborMetrics = new Set<LaborMetric>([
  "reportedLaborHours",
  "reportedTrainingHours",
  "estimatedPayrollAfterTax",
  "costPerLaborHour",
  "templateLaborHours",
  "laborHourVariance",
  "laborHourVariancePercent",
  "payrollPctOfSales",
])
const timecardMetrics = new Set<LaborMetric>([
  "reportedLaborHours",
  "reportedTrainingHours",
  "estimatedPayrollAfterTax",
  "costPerLaborHour",
])
const scheduledMetrics = new Set<LaborMetric>(["templateLaborHours"])
const derivedLaborMetrics = new Set<LaborMetric>([
  "laborHourVariance",
  "laborHourVariancePercent",
  "payrollPctOfSales",
])
const wasteMetrics = new Set<WasteMetric>(["wasteItems", "wasteCost", "wasteCostPctOfSales"])
const wasteQueryMetrics = new Set<WasteMetric>(["wasteItems", "wasteCost"])
const derivedWasteMetrics = new Set<WasteMetric>(["wasteCostPctOfSales"])
const lineItemMetrics = new Set<LineItemsMetric>(["unitsSold"])

export const isLaborMetric = (metric: Metric): metric is LaborMetric =>
  laborMetrics.has(metric as LaborMetric)

export const isTimecardMetric = (metric: Metric): boolean =>
  timecardMetrics.has(metric as LaborMetric)

export const isScheduledMetric = (metric: Metric): boolean =>
  scheduledMetrics.has(metric as LaborMetric)

export const isDerivedLaborMetric = (metric: Metric): boolean =>
  derivedLaborMetrics.has(metric as LaborMetric)

export const isWasteMetric = (metric: Metric): metric is WasteMetric =>
  wasteMetrics.has(metric as WasteMetric)

export const isWasteQueryMetric = (metric: Metric): boolean =>
  wasteQueryMetrics.has(metric as WasteMetric)

export const isDerivedWasteMetric = (metric: Metric): boolean =>
  derivedWasteMetrics.has(metric as WasteMetric)

export const isLineItemMetric = (metric: Metric): metric is LineItemsMetric =>
  lineItemMetrics.has(metric as LineItemsMetric)

export const requiresLineItemsQuery = (metrics: Metric[]): boolean => metrics.some(isLineItemMetric)

export const requiresLaborQuery = (metrics: Metric[], dimensions: Dimension[]): boolean =>
  metrics.some(isTimecardMetric) || dimensions.includes("jobTitle")

export const requiresScheduledQuery = (metrics: Metric[]): boolean =>
  metrics.some(isScheduledMetric)

export const requiresWasteQuery = (metrics: Metric[]): boolean => metrics.some(isWasteQueryMetric)

export const ensureSupportedMetric = (metric: Metric) => {
  if (unsupportedMetrics.has(metric)) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Metric ${metric} is not supported in report queries`,
      clientSafeMessage: `Metric "${metric}" is not supported yet.`,
      additionalContext: { metric },
    })
  }
}

export const ensureSupportedDimension = (dimension: Dimension) => {
  if (unsupportedDimensions.has(dimension)) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Dimension ${dimension} is not supported in report queries`,
      clientSafeMessage: `Dimension "${dimension}" is not supported yet.`,
      additionalContext: { dimension },
    })
  }
}

export const isSupportedMetric = (metric: Metric): metric is SupportedMetric =>
  !unsupportedMetrics.has(metric)

export const isComputedDimension = (dimension: Dimension): dimension is ComputedDimension =>
  dimension !== "locationId" &&
  dimension !== "saleDate" &&
  dimension !== "channel" &&
  dimension !== "jobTitle" &&
  !orderLevelDimensions.has(dimension as OrderLevelDimension)

export const requiresOrderLevelQuery = (dimensions: Dimension[]): boolean =>
  dimensions.includes("channel") ||
  dimensions.some((dimension) => orderLevelDimensions.has(dimension as OrderLevelDimension))

export const hasIncompatibleDimensions = (dimensions: Dimension[]): boolean =>
  (dimensions.includes("product") || dimensions.includes("productCategory")) &&
  dimensions.includes("paymentMethod")

export const getQueryMode = (metrics: Metric[], dimensions: Dimension[]): QueryMode => {
  if (requiresWasteQuery(metrics)) return "waste"
  if (requiresScheduledQuery(metrics)) return "scheduled"
  if (requiresLaborQuery(metrics, dimensions)) return "labor"
  if (requiresLineItemsQuery(metrics)) return "lineItems"
  if (dimensions.includes("product") || dimensions.includes("productCategory")) return "lineItems"
  if (dimensions.includes("paymentMethod")) return "tenders"
  if (dimensions.includes("customer") || dimensions.includes("channel")) return "orders"
  return "dailySales"
}

export const hasCrossModePivotConflict = (
  metrics: Metric[],
  rows: Dimension[],
  columns: Dimension[],
) =>
  rows.length > 0 &&
  columns.length > 0 &&
  requiresOrderLevelQuery(rows) &&
  requiresOrderLevelQuery(columns) &&
  getQueryMode(metrics, rows) !== getQueryMode(metrics, columns)

export const hasMixedLaborAndSalesMetrics = (metrics: Metric[]): boolean => {
  const laborCount = metrics.filter(isLaborMetric).length
  return laborCount > 0 && laborCount < metrics.length
}

export const requiresMultiQueryDispatch = (metrics: Metric[]): boolean => {
  let hasSales = false
  let hasTimecard = false
  let hasScheduled = false
  let hasWaste = false
  let hasLineItems = false
  let hasDerived = false

  for (const metric of metrics) {
    if (isDerivedLaborMetric(metric) || isDerivedWasteMetric(metric)) {
      hasDerived = true
      continue
    }
    if (isScheduledMetric(metric)) {
      hasScheduled = true
      continue
    }
    if (isTimecardMetric(metric)) {
      hasTimecard = true
      continue
    }
    if (isWasteQueryMetric(metric)) {
      hasWaste = true
      continue
    }
    if (isLineItemMetric(metric)) {
      hasLineItems = true
      continue
    }
    hasSales = true
  }

  const sourceCount =
    (hasSales ? 1 : 0) +
    (hasTimecard ? 1 : 0) +
    (hasScheduled ? 1 : 0) +
    (hasWaste ? 1 : 0) +
    (hasLineItems ? 1 : 0)
  return hasDerived || sourceCount > 1
}

const SHARED_DIMENSIONS = new Set<Dimension>([
  "locationId",
  "saleDate",
  "dayOfWeek",
  "year",
  "week",
  "month",
])

export const isSharedDimension = (dimension: Dimension): boolean => SHARED_DIMENSIONS.has(dimension)

export const mergeReportDimensions = (rows: Dimension[], columns: Dimension[]) => [
  ...new Set([...rows, ...columns]),
]

export const PIVOT_CARDINALITY_CAP = 50

type ReportValue = string | number | null

const stringifyKeyPart = (value: ReportValue) => (value === null ? "__null__" : String(value))

const buildCoordinateKey = (coordinate: PivotCoordinate) =>
  coordinate.values.map(({ dimension, value }) => `${dimension}:${String(value)}`).join("|")

const buildPivotColumnKey = (coordinate: PivotCoordinate, metric: Metric) =>
  `pivot::${coordinate.values.map(({ value }) => String(value)).join("::")}::${metric}`

const buildRowGroupKey = (config: ReportConfig, row: Record<string, ReportValue>) =>
  config.rows
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

export const pivotReportResult = (
  config: ReportConfig,
  flatColumns: ReportColumn[],
  flatRows: Record<string, ReportValue>[],
): { columns: ReportColumn[]; rows: Record<string, ReportValue>[] } => {
  if (config.columns.length === 0) {
    return { columns: flatColumns, rows: flatRows }
  }

  const pivotCoordinates: PivotCoordinate[] = []
  const pivotCoordinateKeys = new Set<string>()

  for (const row of flatRows) {
    const coordinate: PivotCoordinate = {
      values: config.columns.map((dimension) => {
        const value = row[dimension]

        if (typeof value !== "string" && typeof value !== "number") {
          throw DomainError.makeError({
            code: "INTERNAL_ERROR",
            message: `Pivot dimension ${dimension} produced a non-scalar value`,
            additionalContext: { dimension },
          })
        }

        return { dimension, value }
      }),
    }
    const coordinateKey = buildCoordinateKey(coordinate)

    if (pivotCoordinateKeys.has(coordinateKey)) continue

    pivotCoordinateKeys.add(coordinateKey)
    pivotCoordinates.push(coordinate)

    if (pivotCoordinates.length > PIVOT_CARDINALITY_CAP) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: "Pivot coordinate cardinality cap exceeded",
        clientSafeMessage:
          "Pivot would produce too many columns. Narrow the date range or remove a column dimension.",
        additionalContext: {
          distinctPivotCoordinates: pivotCoordinates.length,
        },
      })
    }
  }

  const groupedRows = new Map<string, Record<string, ReportValue>[]>()

  for (const row of flatRows) {
    const rowKey = buildRowGroupKey(config, row)
    const group = groupedRows.get(rowKey)

    if (group) {
      group.push(row)
      continue
    }

    groupedRows.set(rowKey, [row])
  }

  const pivotedRows = [...groupedRows.values()].map((group) => {
    const baseRow = group[0]
    const nextRow: Record<string, ReportValue> = Object.fromEntries(
      config.rows.map((dimension) => [dimension, baseRow?.[dimension] ?? null]),
    )
    const groupByCoordinate = new Map(
      group.map((row) => {
        const coordinate: PivotCoordinate = {
          values: config.columns.map((dimension) => {
            const value = row[dimension]

            if (typeof value !== "string" && typeof value !== "number") {
              throw DomainError.makeError({
                code: "INTERNAL_ERROR",
                message: `Pivot dimension ${dimension} produced a non-scalar value`,
                additionalContext: { dimension },
              })
            }

            return { dimension, value }
          }),
        }

        return [buildCoordinateKey(coordinate), row] as const
      }),
    )

    for (const coordinate of pivotCoordinates) {
      const matchingRow = groupByCoordinate.get(buildCoordinateKey(coordinate))

      for (const metric of config.metrics) {
        nextRow[buildPivotColumnKey(coordinate, metric)] = matchingRow?.[metric] ?? null
      }
    }

    return nextRow
  })

  const rowDimensionColumns = config.rows.map((dimension) => {
    const column =
      flatColumns.find(
        (item): item is Extract<ReportColumn, { kind: "dimension" }> =>
          item.kind === "dimension" && item.dimension === dimension,
      ) ??
      ({
        kind: "dimension",
        key: dimension,
        dimension,
        label: "",
      } satisfies ReportColumn)

    return {
      ...column,
      label: column.label || formatReportColumn(column),
    } satisfies ReportColumn
  })

  const metricColumns = pivotCoordinates.flatMap((coordinate) =>
    config.metrics.map((metric) => {
      const column: ReportColumn = {
        kind: "metric",
        key: buildPivotColumnKey(coordinate, metric),
        metric,
        pivot: coordinate,
        label: "",
      }

      return {
        ...column,
        label: formatReportColumn(column),
      } satisfies ReportColumn
    }),
  )

  return {
    columns: [...rowDimensionColumns, ...metricColumns],
    rows: pivotedRows,
  }
}

export const requireBetweenValues = (
  dimension: Dimension,
  operator: "eq" | "in" | "between",
  value: string | string[],
) => {
  const values = Array.isArray(value) ? value : [value]
  const [from, to] = values

  if (!from || !to) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Filter ${dimension}:${operator} requires two values`,
      clientSafeMessage: `Filter "${dimension}" requires two values.`,
      additionalContext: { dimension, operator },
    })
  }

  return { from, to }
}

export const serializeReportValue = (value: unknown): string | number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  return typeof value === "string" || typeof value === "number" ? value : String(value)
}

const parseIsoDate = (isoDateString: string): Date => {
  const [year, month, day] = isoDateString.split("-").map(Number)

  if (!year || !month || !day) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Invalid date value: ${isoDateString}`,
      clientSafeMessage: "Date range contains an invalid value.",
      additionalContext: { value: isoDateString },
    })
  }

  return new Date(Date.UTC(year, month - 1, day))
}

const formatIsoDate = (date: Date): string => {
  const year = date.getUTCFullYear().toString().padStart(4, "0")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export type DateRange = { from: string; to: string }

export const shiftRangeBack1Year = (range: DateRange): DateRange => {
  const fromDate = parseIsoDate(range.from)
  const toDate = parseIsoDate(range.to)
  const shiftedFromDate = new Date(
    Date.UTC(fromDate.getUTCFullYear() - 1, fromDate.getUTCMonth(), fromDate.getUTCDate()),
  )
  const shiftedToDate = new Date(
    Date.UTC(toDate.getUTCFullYear() - 1, toDate.getUTCMonth(), toDate.getUTCDate()),
  )
  return { from: formatIsoDate(shiftedFromDate), to: formatIsoDate(shiftedToDate) }
}

export const yearToDateRange = (range: DateRange): DateRange => {
  const toDate = parseIsoDate(range.to)
  const startOfYearDate = new Date(Date.UTC(toDate.getUTCFullYear(), 0, 1))
  return { from: formatIsoDate(startOfYearDate), to: range.to }
}
