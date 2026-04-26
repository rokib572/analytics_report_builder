import { sql, type SQL } from "drizzle-orm"
import type { MetricFilter } from "@analytics/report-builder"

const MONETARY_METRICS = new Set<MetricFilter["metric"]>(["netSales", "estimatedPayrollAfterTax"])
const HOUR_METRICS = new Set<MetricFilter["metric"]>(["reportedLaborHours"])

const CENTS_PER_DOLLAR = 100
const MILLI_HOURS_PER_HOUR = 1000

const toStorageUnit = (metric: MetricFilter["metric"], rawValue: string): number | null => {
  const trimmed = rawValue.trim()
  if (trimmed.length === 0) return null
  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric)) return null
  if (MONETARY_METRICS.has(metric)) return Math.round(numeric * CENTS_PER_DOLLAR)
  if (HOUR_METRICS.has(metric)) return Math.round(numeric * MILLI_HOURS_PER_HOUR)
  return numeric
}

export const buildMetricFilterCondition = (
  metricExpression: SQL<bigint | number>,
  filter: MetricFilter,
): SQL | null => {
  if (filter.operator === "between") {
    const [from, to] = Array.isArray(filter.value) ? filter.value : ["", ""]
    const fromValue = toStorageUnit(filter.metric, from)
    const toValue = toStorageUnit(filter.metric, to)
    if (fromValue === null || toValue === null) return null
    return sql`${metricExpression} BETWEEN ${fromValue} AND ${toValue}`
  }

  const rawValue = Array.isArray(filter.value) ? (filter.value[0] ?? "") : filter.value
  const value = toStorageUnit(filter.metric, rawValue)
  if (value === null) return null

  if (filter.operator === "eq") return sql`${metricExpression} = ${value}`
  if (filter.operator === "gt") return sql`${metricExpression} > ${value}`
  if (filter.operator === "lt") return sql`${metricExpression} < ${value}`
  return null
}
