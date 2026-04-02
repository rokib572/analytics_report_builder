import { and, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm"
import {
  ensureSupportedDimension,
  ensureSupportedMetric,
  isComputedDimension,
  isSupportedMetric,
  mergeReportDimensions,
  requireBetweenValues,
  serializeReportValue,
  type ComputedDimension,
  type Dimension,
  type ReportConfig,
  type ReportQueryResult,
  type SupportedMetric,
} from "@analytics/report-builder"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../../db/client"
import { dailySales } from "../../daily-sales/schema"
import { locations } from "../../locations/schema"
import type {
  DimensionDefinition,
  GroupableExpression,
  MetricDefinition,
  SelectExpression,
} from "./type"

const metricMap: Record<SupportedMetric, MetricDefinition> = {
  netSales: {
    select: sql<bigint>`coalesce(sum(${dailySales.netSales}), 0)`,
  },
  grossSales: {
    select: sql<bigint>`coalesce(sum(${dailySales.grossSales}), 0)`,
  },
  orderCount: {
    select: sql<number>`coalesce(sum(${dailySales.orderCount}), 0)`,
  },
  storeGrossSales: {
    select: sql<bigint>`coalesce(sum(${dailySales.storeGrossSales}), 0)`,
  },
  totalDiscounts: {
    select: sql<bigint>`coalesce(sum(${dailySales.totalDiscounts}), 0)`,
  },
  totalTax: {
    select: sql<bigint>`coalesce(sum(${dailySales.totalTax}), 0)`,
  },
  totalTips: {
    select: sql<bigint>`coalesce(sum(${dailySales.totalTips}), 0)`,
  },
  totalCollected: {
    select: sql<bigint>`coalesce(sum(${dailySales.totalCollected}), 0)`,
  },
}

const dayOfWeekExpr = sql<number>`extract(isodow from ${dailySales.saleDate}::timestamp)`
const weekGroupExpr = sql`date_trunc('week', ${dailySales.saleDate}::timestamp)`
const monthGroupExpr = sql`date_trunc('month', ${dailySales.saleDate}::timestamp)`

const dimensionMap: Record<Exclude<Dimension, "channel">, DimensionDefinition> = {
  locationId: {
    select: dailySales.locationId,
    groupBy: dailySales.locationId,
    orderBy: dailySales.locationId,
  },
  saleDate: {
    select: dailySales.saleDate,
    groupBy: dailySales.saleDate,
    orderBy: dailySales.saleDate,
  },
  dayOfWeek: {
    select: dayOfWeekExpr,
    groupBy: dayOfWeekExpr,
    orderBy: dayOfWeekExpr,
  },
  week: {
    select: sql<string>`to_char(${weekGroupExpr}, 'YYYY-MM-DD')`,
    groupBy: weekGroupExpr,
    orderBy: weekGroupExpr,
  },
  month: {
    select: sql<string>`to_char(${monthGroupExpr}, 'YYYY-MM-01')`,
    groupBy: monthGroupExpr,
    orderBy: monthGroupExpr,
  },
}

const buildComputedDimensionCondition = (
  dimension: ComputedDimension,
  operator: "eq" | "in" | "between",
  value: string | string[],
): SQL => {
  const expr = dimensionMap[dimension].groupBy

  if (operator === "eq") {
    return sql`${expr} = ${String(value)}`
  }

  if (operator === "in") {
    const values = Array.isArray(value) ? value : [value]
    return sql`${expr} in (${sql.join(
      values.map((item) => sql`${item}`),
      sql`, `,
    )})`
  }

  const { from, to } = requireBetweenValues(dimension, operator, value)
  return sql`${expr} >= ${from} and ${expr} <= ${to}`
}

export const buildReportQuery = async (
  db: DbClient,
  customerId: string,
  config: ReportConfig,
): Promise<ReportQueryResult> => {
  for (const metric of config.metrics) ensureSupportedMetric(metric)
  for (const dimension of [...config.rows, ...config.columns]) ensureSupportedDimension(dimension)
  for (const filter of config.filters) ensureSupportedDimension(filter.dimension)

  const dimensions = mergeReportDimensions(config.rows, config.columns)
  const selectFields: Record<string, SelectExpression | SQL<bigint | number>> = {}
  const groupByFields: GroupableExpression[] = []
  const columnNames: string[] = []

  for (const dimension of dimensions) {
    if (dimension === "channel") continue

    const definition = dimensionMap[dimension]
    selectFields[dimension] = definition.select
    groupByFields.push(definition.groupBy)
    columnNames.push(dimension)

    if (dimension === "locationId") {
      selectFields.locationName = locations.name
      groupByFields.push(locations.name)
      columnNames.push("locationName")
    }
  }

  for (const metric of config.metrics) {
    if (!isSupportedMetric(metric)) continue
    selectFields[metric] = metricMap[metric].select
    columnNames.push(metric)
  }

  const customerClause = eq(locations.customerId, customerId)
  const conditions: SQL[] = [
    gte(dailySales.saleDate, config.dateRange.from),
    lte(dailySales.saleDate, config.dateRange.to),
  ]

  for (const filter of config.filters) {
    if (filter.dimension === "locationId") {
      if (filter.operator === "eq") {
        conditions.push(eq(dailySales.locationId, String(filter.value)))
      } else if (filter.operator === "in") {
        conditions.push(
          inArray(
            dailySales.locationId,
            Array.isArray(filter.value) ? filter.value : [filter.value],
          ),
        )
      } else {
        const { from, to } = requireBetweenValues(filter.dimension, filter.operator, filter.value)
        conditions.push(and(gte(dailySales.locationId, from), lte(dailySales.locationId, to))!)
      }
      continue
    }

    if (filter.dimension === "saleDate") {
      if (filter.operator === "eq") {
        conditions.push(eq(dailySales.saleDate, String(filter.value)))
      } else if (filter.operator === "in") {
        conditions.push(
          inArray(dailySales.saleDate, Array.isArray(filter.value) ? filter.value : [filter.value]),
        )
      } else {
        const { from, to } = requireBetweenValues(filter.dimension, filter.operator, filter.value)
        conditions.push(and(gte(dailySales.saleDate, from), lte(dailySales.saleDate, to))!)
      }
      continue
    }

    if (!isComputedDimension(filter.dimension)) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Dimension ${filter.dimension} is not supported in filters`,
        clientSafeMessage: `Dimension "${filter.dimension}" is not supported yet.`,
        additionalContext: { dimension: filter.dimension },
      })
    }

    conditions.push(
      buildComputedDimensionCondition(filter.dimension, filter.operator, filter.value),
    )
  }

  const whereClause = and(customerClause, ...conditions)
  const firstDimension = dimensions[0]

  let query = db
    .select(selectFields as never)
    .from(dailySales)
    .innerJoin(locations, eq(dailySales.locationId, locations.id))
    .where(whereClause)
    .$dynamic()

  if (groupByFields.length > 0) {
    query = query.groupBy(...groupByFields)
  }

  if (firstDimension && firstDimension !== "channel") {
    query = query.orderBy(sql`${dimensionMap[firstDimension].orderBy} asc`)
  }

  const rows = (await query) as Record<string, unknown>[]

  return {
    columns: columnNames,
    rows: rows.map((row) =>
      Object.fromEntries(
        columnNames.map((column) => [
          column,
          serializeReportValue(row[column as keyof typeof row]),
        ]),
      ),
    ),
    generatedAt: new Date().toISOString(),
  }
}
