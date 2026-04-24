import { and, count, eq, gte, lte, sql, type SQL } from "drizzle-orm"
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
  serializeReportValue,
  type ReportColumn,
  type ReportQueryInput,
  type ReportQueryResult,
} from "@analytics/report-builder"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../../db/client"
import { channels } from "../../channels/schema"
import { dailySales } from "../../daily-sales/schema"
import { catalogCategories } from "../../catalog-categories/schema"
import { catalogItems } from "../../catalog-items/schema"
import { catalogItemVariations } from "../../catalog-item-variations/schema"
import { locations } from "../../locations/schema"
import { orderLineItems } from "../../order-line-items/schema"
import { orderTenders } from "../../order-tenders/schema"
import { orders } from "../../orders/schema"
import { squareCustomers } from "../../customers/schema"
import { buildColumnCondition } from "./build-column-condition"
import { buildExpressionCondition } from "./build-expression-condition"
import { computeSummaryRows } from "./compute-summary-rows"
import { getDimensionDefinition } from "./get-dimension-definition"
import { getModeConfig } from "./get-mode-config"
import type { GroupableExpression, SelectExpression } from "./type"
import { DEFAULT_REPORT_PAGE_SIZE, MAX_REPORT_PAGE_SIZE, PIVOT_SOURCE_ROW_MULTIPLIER } from "./util"

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
              .leftJoin(channels, eq(orders.channelId, channels.id))
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

  if (firstDimension) {
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

  const shouldComputeSummaryRows = config.comparisons && (isPivotedReport || page === 1)
  const summaryRows = shouldComputeSummaryRows
    ? await computeSummaryRows(db, customerId, config, config.comparisons!)
    : []

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
    ...(summaryRows.length > 0 ? { summaryRows } : {}),
  }
}
