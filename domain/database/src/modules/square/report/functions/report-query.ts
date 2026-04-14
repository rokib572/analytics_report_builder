import { and, count, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import {
  ensureSupportedDimension,
  ensureSupportedMetric,
  formatReportColumn,
  hasCrossModePivotConflict,
  hasIncompatibleDimensions,
  isComputedDimension,
  isSupportedMetric,
  pivotReportResult,
  mergeReportDimensions,
  getQueryMode,
  requiresOrderLevelQuery,
  requireBetweenValues,
  serializeReportValue,
  type Dimension,
  type QueryMode,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
  type SupportedMetric,
} from "@analytics/report-builder"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../../db/client"
import { dailySales } from "../../daily-sales/schema"
import { catalogCategories } from "../../catalog-categories/schema"
import { catalogItems } from "../../catalog-items/schema"
import { catalogItemVariations } from "../../catalog-item-variations/schema"
import { locations } from "../../locations/schema"
import { orderLineItems } from "../../order-line-items/schema"
import { orderTenders } from "../../order-tenders/schema"
import { orders } from "../../orders/schema"
import { squareCustomers } from "../../customers/schema"
import type {
  DimensionDefinition,
  GroupableExpression,
  MetricDefinition,
  SelectExpression,
} from "./type"

const DEFAULT_REPORT_PAGE_SIZE = 10_000
const MAX_REPORT_PAGE_SIZE = 50_000
const PIVOT_SOURCE_ROW_MULTIPLIER = 50

const lineItemGrossSalesSum = sql<bigint>`coalesce(sum(${orderLineItems.grossSalesMoney}), 0)`
const lineItemDiscountsSum = sql<bigint>`coalesce(sum(${orderLineItems.totalDiscountMoney}), 0)`
const lineItemTaxSum = sql<bigint>`coalesce(sum(${orderLineItems.totalTaxMoney}), 0)`
const lineItemTotalSum = sql<bigint>`coalesce(sum(${orderLineItems.totalMoney}), 0)`

const tenderAmountSum = sql<bigint>`coalesce(sum(${orderTenders.amountMoney}), 0)`
const tenderTipSum = sql<bigint>`coalesce(sum(${orderTenders.tipMoney}), 0)`

const orderTotalSum = sql<bigint>`coalesce(sum(${orders.totalMoney}), 0)`
const orderTaxSum = sql<bigint>`coalesce(sum(${orders.totalTaxMoney}), 0)`
const orderDiscountsSum = sql<bigint>`coalesce(sum(${orders.totalDiscountMoney}), 0)`
const orderTipSum = sql<bigint>`coalesce(sum(${orders.totalTipMoney}), 0)`
const orderGrossSalesExpr = sql<bigint>`${orderTotalSum} - ${orderTaxSum} - ${orderTipSum} + ${orderDiscountsSum}`
const orderNetSalesExpr = sql<bigint>`${orderTotalSum} - ${orderTaxSum} - ${orderTipSum}`

const customerNameExpr = sql<string>`
  coalesce(
    nullif(trim(concat_ws(' ', ${squareCustomers.givenName}, ${squareCustomers.familyName})), ''),
    'Unknown'
  )
`

const productCategoryNameExpr = sql<string>`coalesce(${catalogCategories.name}, 'Uncategorized')`

const dailySalesMetricMap: Record<SupportedMetric, MetricDefinition> = {
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

const lineItemsMetricMap: Record<SupportedMetric, MetricDefinition> = {
  netSales: {
    select: sql<bigint>`${lineItemGrossSalesSum} - ${lineItemDiscountsSum}`,
  },
  grossSales: {
    select: lineItemGrossSalesSum,
  },
  orderCount: {
    select: sql<number>`count(distinct ${orderLineItems.orderId})`,
  },
  storeGrossSales: {
    select: lineItemGrossSalesSum,
  },
  totalDiscounts: {
    select: lineItemDiscountsSum,
  },
  totalTax: {
    select: lineItemTaxSum,
  },
  totalTips: {
    select: sql<bigint>`0`,
  },
  totalCollected: {
    select: lineItemTotalSum,
  },
}

const tendersMetricMap: Record<SupportedMetric, MetricDefinition> = {
  netSales: {
    select: sql<bigint>`0`,
  },
  grossSales: {
    select: sql<bigint>`0`,
  },
  orderCount: {
    select: sql<number>`count(distinct ${orderTenders.orderId})`,
  },
  storeGrossSales: {
    select: sql<bigint>`0`,
  },
  totalDiscounts: {
    select: sql<bigint>`0`,
  },
  totalTax: {
    select: sql<bigint>`0`,
  },
  totalTips: {
    select: tenderTipSum,
  },
  totalCollected: {
    select: tenderAmountSum,
  },
}

const ordersMetricMap: Record<SupportedMetric, MetricDefinition> = {
  netSales: {
    select: orderNetSalesExpr,
  },
  grossSales: {
    select: orderGrossSalesExpr,
  },
  orderCount: {
    select: sql<number>`count(${orders.id})`,
  },
  storeGrossSales: {
    select: orderGrossSalesExpr,
  },
  totalDiscounts: {
    select: orderDiscountsSum,
  },
  totalTax: {
    select: orderTaxSum,
  },
  totalTips: {
    select: orderTipSum,
  },
  totalCollected: {
    select: orderTotalSum,
  },
}

const getTemporalExpressions = (saleDateColumn: AnyPgColumn) => {
  const dayOfWeekSortExpr = sql<number>`extract(dow from ${saleDateColumn}::timestamp)::int`
  const dayOfWeekNameExpr = sql<string>`
    case ${dayOfWeekSortExpr}
      when 0 then 'Sunday'
      when 1 then 'Monday'
      when 2 then 'Tuesday'
      when 3 then 'Wednesday'
      when 4 then 'Thursday'
      when 5 then 'Friday'
      when 6 then 'Saturday'
    end
  `
  const yearExpr = sql<number>`extract(year from ${saleDateColumn}::timestamp)::int`
  const yearLabelExpr = sql<string>`to_char(${saleDateColumn}::timestamp, 'YYYY')`
  const weekGroupExpr = sql`date_trunc('week', ${saleDateColumn}::timestamp)`
  const weekLabelExpr = sql<string>`to_char(${weekGroupExpr}, 'YYYY-MM-DD')`
  const monthGroupExpr = sql`date_trunc('month', ${saleDateColumn}::timestamp)`
  const monthLabelExpr = sql<string>`to_char(${monthGroupExpr}, 'FMMonth')`

  return {
    dayOfWeekSortExpr,
    dayOfWeekNameExpr,
    yearExpr,
    yearLabelExpr,
    weekGroupExpr,
    weekLabelExpr,
    monthGroupExpr,
    monthLabelExpr,
  }
}

const buildDimensionMap = (
  locationColumn: AnyPgColumn,
  saleDateColumn: AnyPgColumn,
  extraDimensions: Partial<Record<Exclude<Dimension, "channel">, DimensionDefinition>> = {},
): Partial<Record<Exclude<Dimension, "channel">, DimensionDefinition>> => {
  const {
    dayOfWeekSortExpr,
    dayOfWeekNameExpr,
    yearExpr,
    yearLabelExpr,
    weekGroupExpr,
    weekLabelExpr,
    monthGroupExpr,
    monthLabelExpr,
  } = getTemporalExpressions(saleDateColumn)

  return {
    locationId: {
      select: locationColumn,
      groupBy: locationColumn,
      orderBy: locationColumn,
    },
    saleDate: {
      select: saleDateColumn,
      groupBy: saleDateColumn,
      orderBy: saleDateColumn,
    },
    dayOfWeek: {
      select: dayOfWeekNameExpr,
      groupBy: [dayOfWeekSortExpr, dayOfWeekNameExpr],
      orderBy: dayOfWeekSortExpr,
      filterBy: dayOfWeekNameExpr,
    },
    year: {
      select: yearExpr,
      groupBy: yearExpr,
      orderBy: yearExpr,
      filterBy: yearLabelExpr,
    },
    week: {
      select: weekLabelExpr,
      groupBy: weekGroupExpr,
      orderBy: weekGroupExpr,
      filterBy: weekLabelExpr,
    },
    month: {
      select: monthLabelExpr,
      groupBy: monthGroupExpr,
      orderBy: monthGroupExpr,
      filterBy: monthLabelExpr,
    },
    ...extraDimensions,
  }
}

const dailySalesDimensionMap = buildDimensionMap(dailySales.locationId, dailySales.saleDate)
const lineItemsDimensionMap = buildDimensionMap(
  orderLineItems.locationId,
  orderLineItems.saleDate,
  {
    customer: {
      select: customerNameExpr,
      groupBy: customerNameExpr,
      orderBy: customerNameExpr,
    },
    product: {
      select: orderLineItems.name,
      groupBy: orderLineItems.name,
      orderBy: orderLineItems.name,
    },
    productCategory: {
      select: productCategoryNameExpr,
      groupBy: [catalogCategories.name, productCategoryNameExpr],
      orderBy: productCategoryNameExpr,
    },
  },
)
const tendersDimensionMap = buildDimensionMap(orderTenders.locationId, orders.saleDate, {
  customer: {
    select: customerNameExpr,
    groupBy: customerNameExpr,
    orderBy: customerNameExpr,
  },
  paymentMethod: {
    select: orderTenders.type,
    groupBy: orderTenders.type,
    orderBy: orderTenders.type,
  },
})
const ordersDimensionMap = buildDimensionMap(orders.locationId, orders.saleDate, {
  customer: {
    select: customerNameExpr,
    groupBy: customerNameExpr,
    orderBy: customerNameExpr,
  },
})

const dailySalesFilterColumns: Partial<Record<Exclude<Dimension, "channel">, AnyPgColumn>> = {
  locationId: dailySales.locationId,
  saleDate: dailySales.saleDate,
}
const lineItemsFilterColumns: Partial<Record<Exclude<Dimension, "channel">, AnyPgColumn>> = {
  locationId: orderLineItems.locationId,
  saleDate: orderLineItems.saleDate,
  product: orderLineItems.name,
  productCategory: catalogCategories.name,
}
const tendersFilterColumns: Partial<Record<Exclude<Dimension, "channel">, AnyPgColumn>> = {
  locationId: orderTenders.locationId,
  saleDate: orders.saleDate,
  paymentMethod: orderTenders.type,
}
const ordersFilterColumns: Partial<Record<Exclude<Dimension, "channel">, AnyPgColumn>> = {
  locationId: orders.locationId,
  saleDate: orders.saleDate,
}

const buildExpressionCondition = (
  dimension: Dimension,
  expression: GroupableExpression,
  operator: "eq" | "in" | "between",
  value: string | string[],
): SQL => {
  if (operator === "eq") {
    return sql`${expression} = ${String(value)}`
  }

  if (operator === "in") {
    const values = Array.isArray(value) ? value : [value]
    return sql`${expression} in (${sql.join(
      values.map((item) => sql`${item}`),
      sql`, `,
    )})`
  }

  const { from, to } = requireBetweenValues(dimension, operator, value)
  return sql`${expression} >= ${from} and ${expression} <= ${to}`
}

const buildColumnCondition = (
  column: AnyPgColumn,
  dimension: Dimension,
  operator: "eq" | "in" | "between",
  value: string | string[],
): SQL => {
  if (operator === "eq") {
    return eq(column, String(value))
  }

  if (operator === "in") {
    return inArray(column, Array.isArray(value) ? value : [value])
  }

  const { from, to } = requireBetweenValues(dimension, operator, value)
  return and(gte(column, from), lte(column, to))!
}

const getModeConfig = (
  mode: QueryMode,
): {
  metricMap: Record<SupportedMetric, MetricDefinition>
  dimensionMap: Partial<Record<Exclude<Dimension, "channel">, DimensionDefinition>>
  filterColumns: Partial<Record<Exclude<Dimension, "channel">, AnyPgColumn>>
} => {
  switch (mode) {
    case "lineItems":
      return {
        metricMap: lineItemsMetricMap,
        dimensionMap: lineItemsDimensionMap,
        filterColumns: lineItemsFilterColumns,
      }
    case "tenders":
      return {
        metricMap: tendersMetricMap,
        dimensionMap: tendersDimensionMap,
        filterColumns: tendersFilterColumns,
      }
    case "orders":
      return {
        metricMap: ordersMetricMap,
        dimensionMap: ordersDimensionMap,
        filterColumns: ordersFilterColumns,
      }
    default:
      return {
        metricMap: dailySalesMetricMap,
        dimensionMap: dailySalesDimensionMap,
        filterColumns: dailySalesFilterColumns,
      }
  }
}

const getDimensionDefinition = (
  dimensionMap: Partial<Record<Exclude<Dimension, "channel">, DimensionDefinition>>,
  dimension: Exclude<Dimension, "channel">,
) => {
  const definition = dimensionMap[dimension]

  if (!definition) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Dimension ${dimension} is not available for this report query`,
      clientSafeMessage: `Dimension "${dimension}" is not available for this report.`,
      additionalContext: { dimension },
    })
  }

  return definition
}

export const buildReportQuery = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
): Promise<ReportQueryResult> => {
  for (const metric of config.metrics) ensureSupportedMetric(metric)
  for (const dimension of [...config.rows, ...config.columns]) ensureSupportedDimension(dimension)
  for (const filter of config.filters) ensureSupportedDimension(filter.dimension)

  if (config.columns.length > 0 && config.metrics.length === 0) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Pivot reports require at least one metric",
      clientSafeMessage: "Add at least one metric before pivoting columns.",
    })
  }

  const dimensions = mergeReportDimensions(config.rows, config.columns)
  const filterDimensions = [...new Set(config.filters.map((filter) => filter.dimension))]
  const queryDimensions = [...new Set([...dimensions, ...filterDimensions])]

  if (hasIncompatibleDimensions(queryDimensions)) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Product/Product Category and Payment Method dimensions cannot be combined",
      clientSafeMessage:
        "Product or Product Category cannot be used in the same report as Payment Method.",
    })
  }

  if (hasCrossModePivotConflict(config.rows, config.columns)) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Row and column pivot dimensions must share the same query mode",
      clientSafeMessage:
        "Rows and columns must use dimensions from the same query mode when pivoting.",
    })
  }

  const queryMode = requiresOrderLevelQuery(queryDimensions)
    ? getQueryMode(queryDimensions)
    : "dailySales"
  const page = Math.max(1, config.page ?? 1)
  const pageSize = Math.min(
    MAX_REPORT_PAGE_SIZE,
    Math.max(1, config.pageSize ?? DEFAULT_REPORT_PAGE_SIZE),
  )
  const offset = (page - 1) * pageSize
  const isPivotedReport = config.columns.length > 0
  const { metricMap, dimensionMap, filterColumns } = getModeConfig(queryMode)
  const selectFields: Record<string, SelectExpression | SQL<bigint | number>> = {}
  const groupByFields: GroupableExpression[] = []
  const flatColumns: ReportColumn[] = []

  for (const dimension of dimensions) {
    if (dimension === "channel") continue

    const definition = getDimensionDefinition(dimensionMap, dimension)
    selectFields[dimension] = definition.select
    groupByFields.push(
      ...(Array.isArray(definition.groupBy) ? definition.groupBy : [definition.groupBy]),
    )
    const column: ReportColumn = {
      kind: "dimension",
      key: dimension,
      dimension,
      label: "",
    }
    flatColumns.push({
      ...column,
      label: formatReportColumn(column),
    })

    if (dimension === "locationId") groupByFields.push(locations.name)
  }

  for (const metric of config.metrics) {
    if (!isSupportedMetric(metric)) continue
    selectFields[metric] = metricMap[metric].select
    const column: ReportColumn = {
      kind: "metric",
      key: metric,
      metric,
      label: "",
    }
    flatColumns.push({
      ...column,
      label: formatReportColumn(column),
    })
  }

  const customerClause =
    queryMode === "orders"
      ? eq(orders.customerId, customerId)
      : eq(locations.customerId, customerId)
  const dateColumn =
    queryMode === "dailySales"
      ? dailySales.saleDate
      : queryMode === "lineItems"
        ? orderLineItems.saleDate
        : orders.saleDate
  const conditions: SQL[] = [
    gte(dateColumn, config.dateRange.from),
    lte(dateColumn, config.dateRange.to),
  ]

  for (const filter of config.filters) {
    if (filter.dimension === "channel") {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Dimension ${filter.dimension} is not supported in filters`,
        clientSafeMessage: `Dimension "${filter.dimension}" is not supported yet.`,
        additionalContext: { dimension: filter.dimension },
      })
    }

    const filterColumn = filterColumns[filter.dimension]

    if (filterColumn) {
      conditions.push(
        buildColumnCondition(filterColumn, filter.dimension, filter.operator, filter.value),
      )
      continue
    }

    if (!isComputedDimension(filter.dimension) && filter.dimension !== "customer") {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Dimension ${filter.dimension} is not supported in filters`,
        clientSafeMessage: `Dimension "${filter.dimension}" is not supported yet.`,
        additionalContext: { dimension: filter.dimension },
      })
    }

    const definition = getDimensionDefinition(dimensionMap, filter.dimension)
    const filterExpression = definition.filterBy ?? definition.select
    conditions.push(
      buildExpressionCondition(filter.dimension, filterExpression, filter.operator, filter.value),
    )
  }

  const whereClause = and(customerClause, ...conditions)
  const firstDimension = dimensions[0]

  const baseQuery =
    queryMode === "dailySales"
      ? db
          .select(selectFields as never)
          .from(dailySales)
          .innerJoin(locations, eq(dailySales.locationId, locations.id))
      : queryMode === "lineItems"
        ? db
            .select(selectFields as never)
            .from(orderLineItems)
            .innerJoin(locations, eq(orderLineItems.locationId, locations.id))
            .leftJoin(
              catalogItemVariations,
              and(
                eq(orderLineItems.catalogObjectId, catalogItemVariations.squareId),
                eq(catalogItemVariations.customerId, customerId),
              ),
            )
            .leftJoin(
              catalogItems,
              and(
                eq(catalogItemVariations.itemId, catalogItems.id),
                eq(catalogItems.customerId, customerId),
              ),
            )
            .leftJoin(
              catalogCategories,
              and(
                eq(catalogItems.categoryId, catalogCategories.squareId),
                eq(catalogCategories.customerId, customerId),
              ),
            )
            .leftJoin(orders, eq(orderLineItems.orderId, orders.id))
            .leftJoin(
              squareCustomers,
              and(
                eq(orders.squareCustomerId, squareCustomers.squareId),
                eq(squareCustomers.customerId, customerId),
              ),
            )
        : queryMode === "tenders"
          ? db
              .select(selectFields as never)
              .from(orderTenders)
              .innerJoin(locations, eq(orderTenders.locationId, locations.id))
              .leftJoin(orders, eq(orderTenders.orderId, orders.id))
              .leftJoin(
                squareCustomers,
                and(
                  eq(orders.squareCustomerId, squareCustomers.squareId),
                  eq(squareCustomers.customerId, customerId),
                ),
              )
          : db
              .select(selectFields as never)
              .from(orders)
              .innerJoin(locations, eq(orders.locationId, locations.id))
              .leftJoin(
                squareCustomers,
                and(
                  eq(orders.squareCustomerId, squareCustomers.squareId),
                  eq(squareCustomers.customerId, customerId),
                ),
              )

  let query = baseQuery.where(whereClause).$dynamic()

  if (groupByFields.length > 0) {
    query = query.groupBy(...groupByFields)
  }

  const countPromise =
    !isPivotedReport && page === 1
      ? db.select({ totalCount: count() }).from(query.as("report_rows"))
      : Promise.resolve(null)

  if (firstDimension && firstDimension !== "channel") {
    const definition = getDimensionDefinition(dimensionMap, firstDimension)
    query = query.orderBy(sql`${definition.orderBy} asc`)
  }

  const rowsPromise = isPivotedReport
    ? query.limit(pageSize * PIVOT_SOURCE_ROW_MULTIPLIER)
    : query.limit(pageSize + 1).offset(offset)
  const [rowResults, countRows] = await Promise.all([rowsPromise, countPromise])
  const hasMore = !isPivotedReport && rowResults.length > pageSize
  const visibleRows = !isPivotedReport && hasMore ? rowResults.slice(0, pageSize) : rowResults
  const totalRows =
    countRows && countRows[0]
      ? Number((countRows[0] as { totalCount?: number | string | bigint }).totalCount ?? 0)
      : undefined
  const flatRows = visibleRows.map((row) =>
    Object.fromEntries(
      flatColumns.map((column) => [
        column.key,
        serializeReportValue(row[column.key as keyof typeof row]),
      ]),
    ),
  )
  const { columns, rows } = pivotReportResult(config, flatColumns, flatRows)

  return {
    columns,
    rows,
    generatedAt: new Date().toISOString(),
    page: isPivotedReport ? 1 : page,
    pageSize,
    hasMore: isPivotedReport ? false : hasMore,
    ...(isPivotedReport
      ? { totalRows: rows.length }
      : totalRows !== undefined
        ? { totalRows }
        : {}),
  }
}
