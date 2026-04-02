import { DomainError } from "@analytics/shared-libs"
import type {
  ComputedDimension,
  Dimension,
  Metric,
  OrderLevelDimension,
  SupportedMetric,
} from "./types"

const unsupportedMetrics = new Set<Metric>(["uberGrossSales", "uberBogoRecoverable"])
const unsupportedDimensions = new Set<Dimension>(["channel"])
const orderLevelDimensions = new Set<OrderLevelDimension>(["customer", "product", "paymentMethod"])

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
  dimensions.some((dimension) => orderLevelDimensions.has(dimension as OrderLevelDimension))

export const hasIncompatibleDimensions = (dimensions: Dimension[]): boolean =>
  dimensions.includes("product") && dimensions.includes("paymentMethod")

export const mergeReportDimensions = (rows: Dimension[], columns: Dimension[]) => [
  ...new Set([...rows, ...columns]),
]

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
