import { DomainError } from "@analytics/shared-libs"
import type {
  ComputedDimension,
  Dimension,
  Metric,
  OrderLevelDimension,
  PivotCoordinate,
  QueryMode,
  ReportColumn,
  ReportConfig,
  SupportedMetric,
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
  !orderLevelDimensions.has(dimension as OrderLevelDimension)

export const requiresOrderLevelQuery = (dimensions: Dimension[]): boolean =>
  dimensions.includes("channel") ||
  dimensions.some((dimension) => orderLevelDimensions.has(dimension as OrderLevelDimension))

export const hasIncompatibleDimensions = (dimensions: Dimension[]): boolean =>
  (dimensions.includes("product") || dimensions.includes("productCategory")) &&
  dimensions.includes("paymentMethod")

export const getQueryMode = (dimensions: Dimension[]): QueryMode => {
  if (dimensions.includes("product") || dimensions.includes("productCategory")) return "lineItems"
  if (dimensions.includes("paymentMethod")) return "tenders"
  if (dimensions.includes("customer") || dimensions.includes("channel")) return "orders"
  return "dailySales"
}

export const hasCrossModePivotConflict = (rows: Dimension[], columns: Dimension[]) =>
  rows.length > 0 &&
  columns.length > 0 &&
  requiresOrderLevelQuery(rows) &&
  requiresOrderLevelQuery(columns) &&
  getQueryMode(rows) !== getQueryMode(columns)

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
