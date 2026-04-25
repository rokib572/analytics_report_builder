import { and, count, eq, gte, lte, sql, type SQL, type SQLWrapper } from "drizzle-orm"
import {
  ensureSupportedDimension,
  ensureSupportedMetric,
  formatReportColumn,
  hasCrossModePivotConflict,
  hasIncompatibleDimensions,
  isComputedDimension,
  isDerivedLaborMetric,
  isDerivedWasteMetric,
  isLineItemMetric,
  isScheduledMetric,
  isSharedDimension,
  isSupportedMetric,
  isTimecardMetric,
  isWasteQueryMetric,
  pivotReportResult,
  mergeReportDimensions,
  getQueryMode,
  requiresLaborQuery,
  requiresLineItemsQuery,
  requiresMultiQueryDispatch,
  requiresOrderLevelQuery,
  requiresScheduledQuery,
  requiresWasteQuery,
  serializeReportValue,
  type Dimension,
  type Metric,
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
import { inventoryAdjustments } from "../../inventory-adjustments/schema"
import { laborScheduledShifts } from "../../labor-scheduled-shifts/schema"
import { laborTimecards } from "../../labor-timecards/schema"
import { locations } from "../../locations/schema"
import { orderLineItems } from "../../order-line-items/schema"
import { orderTenders } from "../../order-tenders/schema"
import { orders } from "../../orders/schema"
import { squareCustomers } from "../../customers/schema"
import { appendChannelBreakdownColumns } from "./append-channel-breakdown-columns"
import { appendComparisonColumns } from "./append-comparison-columns"
import { appendInlineYtdColumns } from "./append-ytd-columns"
import { appendLaborHourVariancePercentMetric } from "./append-labor-hour-variance-percent-metric"
import { appendPayrollPctOfSalesMetric } from "./append-payroll-pct-of-sales-metric"
import { buildColumnCondition } from "./build-column-condition"
import { buildExpressionCondition } from "./build-expression-condition"
import { computeSummaryRows } from "./compute-summary-rows"
import { enrichLocationAttributes } from "./enrich-location-attributes"
import { getDimensionDefinition } from "./get-dimension-definition"
import { getModeConfig } from "./get-mode-config"
import { reorderColumnsByMetricSequence } from "./reorder-columns-by-metric-sequence"
import type { GroupableExpression, SelectExpression } from "./type"
import {
  DEFAULT_REPORT_PAGE_SIZE,
  MAX_REPORT_PAGE_SIZE,
  PIVOT_SOURCE_ROW_MULTIPLIER,
  WASTE_INVENTORY_STATE,
  wasteDateFilterExpression,
} from "./util"

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

  if (hasCrossModePivotConflict(config.metrics, config.rows, config.columns)) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: "Row and column pivot dimensions must share the same query mode",
      clientSafeMessage:
        "Rows and columns must use dimensions from the same query mode when pivoting.",
    })
  }

  if (requiresMultiQueryDispatch(config.metrics)) {
    return runMixedReportQuery(db, customerId, config)
  }

  const queryMode =
    requiresWasteQuery(config.metrics) ||
    requiresScheduledQuery(config.metrics) ||
    requiresLaborQuery(config.metrics, queryDimensions) ||
    requiresLineItemsQuery(config.metrics) ||
    requiresOrderLevelQuery(queryDimensions)
      ? getQueryMode(config.metrics, queryDimensions)
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
    const definition = metricMap[metric]

    if (!definition) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Metric ${metric} is not available in ${queryMode} mode`,
        clientSafeMessage: `Metric "${metric}" is not available with the current dimensions.`,
        additionalContext: { metric, queryMode },
      })
    }

    selectFields[metric] = definition.select
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
    queryMode === "labor"
      ? eq(laborTimecards.customerId, customerId)
      : queryMode === "scheduled"
        ? eq(laborScheduledShifts.customerId, customerId)
        : queryMode === "orders"
          ? eq(orders.customerId, customerId)
          : queryMode === "waste"
            ? eq(inventoryAdjustments.customerId, customerId)
            : eq(locations.customerId, customerId)
  const dateColumn: SQLWrapper =
    queryMode === "dailySales"
      ? dailySales.saleDate
      : queryMode === "lineItems"
        ? orderLineItems.saleDate
        : queryMode === "labor"
          ? laborTimecards.workDate
          : queryMode === "scheduled"
            ? laborScheduledShifts.workDate
            : queryMode === "waste"
              ? wasteDateFilterExpression
              : orders.saleDate
  const conditions: SQL[] = [
    gte(dateColumn, config.dateRange.from),
    lte(dateColumn, config.dateRange.to),
  ]

  if (queryMode === "waste") {
    conditions.push(eq(inventoryAdjustments.toState, WASTE_INVENTORY_STATE))
  }

  for (const filter of config.filters) {
    const filterColumn = filterColumns[filter.dimension]

    if (filterColumn) {
      conditions.push(
        buildColumnCondition(filterColumn, filter.dimension, filter.operator, filter.value),
      )
      continue
    }

    if (
      !isComputedDimension(filter.dimension) &&
      filter.dimension !== "customer" &&
      filter.dimension !== "jobTitle"
    ) {
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
    queryMode === "labor"
      ? db
          .select(selectFields as never)
          .from(laborTimecards)
          .innerJoin(locations, eq(laborTimecards.locationId, locations.id))
      : queryMode === "scheduled"
        ? db
            .select(selectFields as never)
            .from(laborScheduledShifts)
            .innerJoin(locations, eq(laborScheduledShifts.locationId, locations.id))
        : queryMode === "waste"
          ? db
              .select(selectFields as never)
              .from(inventoryAdjustments)
              .innerJoin(locations, eq(inventoryAdjustments.locationId, locations.id))
          : queryMode === "dailySales"
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

  const baseResult: ReportQueryResult = {
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

  const withChannelBreakdown = await appendChannelBreakdownColumns(
    db,
    customerId,
    config,
    baseResult,
  )
  const withYtd = await appendInlineYtdColumns(db, customerId, config, withChannelBreakdown)
  const withComparison = await appendComparisonColumns(db, customerId, config, withYtd)
  const enriched = await enrichLocationAttributes(db, customerId, config, withComparison)
  return reorderColumnsByMetricSequence(enriched, config.metrics)
}

const stringifyKeyPart = (value: string | number | null) =>
  value === null ? "__null__" : String(value)

const buildRowKey = (rowDimensions: Dimension[], row: Record<string, string | number | null>) =>
  rowDimensions
    .map((dimension) => `${dimension}:${stringifyKeyPart(row[dimension] ?? null)}`)
    .join("|")

const mergeReportResults = (
  config: ReportQueryInput,
  primary: ReportQueryResult,
  secondary: ReportQueryResult,
): ReportQueryResult => {
  const dimensionColumns = primary.columns.filter((column) => column.kind === "dimension")
  const primaryMetricColumns = primary.columns.filter((column) => column.kind === "metric")
  const secondaryMetricColumns = secondary.columns.filter((column) => column.kind === "metric")
  const metricColumns = [...primaryMetricColumns, ...secondaryMetricColumns]
  const allColumns = [...dimensionColumns, ...metricColumns]

  const rowMap = new Map<string, Record<string, string | number | null>>()

  for (const row of primary.rows) {
    rowMap.set(buildRowKey(config.rows, row), { ...row })
  }

  for (const row of secondary.rows) {
    const key = buildRowKey(config.rows, row)
    const existing = rowMap.get(key)

    if (existing) {
      for (const [columnKey, value] of Object.entries(row)) {
        if (existing[columnKey] === undefined) {
          existing[columnKey] = value
        }
      }
      continue
    }

    rowMap.set(key, { ...row })
  }

  const mergedRows = [...rowMap.values()].map((row) => {
    const filled: Record<string, string | number | null> = { ...row }

    for (const column of allColumns) {
      if (filled[column.key] === undefined) filled[column.key] = null
    }

    return filled
  })

  return {
    columns: allColumns,
    rows: mergedRows,
    generatedAt: new Date().toISOString(),
    page: 1,
    pageSize: Math.max(mergedRows.length, primary.pageSize),
    hasMore: false,
    totalRows: mergedRows.length,
  }
}

const ORDERS_ONLY_DIMENSIONS = new Set<Dimension>(["channel", "customer", "paymentMethod"])
const LINEITEMS_ONLY_DIMENSIONS = new Set<Dimension>(["product", "productCategory"])
const LABOR_ONLY_DIMENSIONS = new Set<Dimension>(["jobTitle"])
const SALES_ONLY_DIMENSIONS = new Set<Dimension>([
  ...ORDERS_ONLY_DIMENSIONS,
  ...LINEITEMS_ONLY_DIMENSIONS,
])

const splitMetricsBySource = (metrics: Metric[]) => {
  const sales: Metric[] = []
  const timecard: Metric[] = []
  const scheduled: Metric[] = []
  const waste: Metric[] = []
  const lineItems: Metric[] = []
  const derivedLabor: Metric[] = []
  const derivedWaste: Metric[] = []

  for (const metric of metrics) {
    if (isDerivedLaborMetric(metric)) {
      derivedLabor.push(metric)
    } else if (isDerivedWasteMetric(metric)) {
      derivedWaste.push(metric)
    } else if (isScheduledMetric(metric)) {
      scheduled.push(metric)
    } else if (isTimecardMetric(metric)) {
      timecard.push(metric)
    } else if (isWasteQueryMetric(metric)) {
      waste.push(metric)
    } else if (isLineItemMetric(metric)) {
      lineItems.push(metric)
    } else {
      sales.push(metric)
    }
  }

  return { sales, timecard, scheduled, waste, lineItems, derivedLabor, derivedWaste }
}

const stripUnrequestedMetricColumns = (
  result: ReportQueryResult,
  requestedMetrics: Metric[],
): ReportQueryResult => {
  const requestedSet = new Set<Metric>(requestedMetrics)
  const keepColumns = result.columns.filter(
    (column) => column.kind !== "metric" || requestedSet.has(column.metric),
  )
  const keepKeys = new Set(keepColumns.map((column) => column.key))
  const newRows = result.rows.map((row) =>
    Object.fromEntries(Object.entries(row).filter(([key]) => keepKeys.has(key))),
  )

  return { ...result, columns: keepColumns, rows: newRows, totalRows: newRows.length }
}

const REPORTED_METRIC: Metric = "reportedLaborHours"
const TEMPLATE_METRIC: Metric = "templateLaborHours"
const VARIANCE_METRIC: Metric = "laborHourVariance"
const VARIANCE_PERCENT_METRIC: Metric = "laborHourVariancePercent"
const PAYROLL_METRIC: Metric = "estimatedPayrollAfterTax"
const PAYROLL_PCT_METRIC: Metric = "payrollPctOfSales"
const WASTE_COST_METRIC: Metric = "wasteCost"
const NET_SALES_METRIC: Metric = "netSales"
const WASTE_COST_PCT_METRIC: Metric = "wasteCostPctOfSales"

const appendWasteCostPctOfSalesMetric = (result: ReportQueryResult): ReportQueryResult => {
  const wasteCostColumns = result.columns.filter(
    (column) => column.kind === "metric" && column.metric === WASTE_COST_METRIC,
  )

  if (wasteCostColumns.length === 0) return result

  const pctColumns: ReportColumn[] = []
  const keyPairs: Array<{
    wasteCostKey: string
    netSalesKey: string
    pctKey: string
  }> = []

  for (const wasteCostColumn of wasteCostColumns) {
    if (wasteCostColumn.kind !== "metric") continue
    const wasteCostKey = wasteCostColumn.key
    const netSalesKey = wasteCostKey.replace(/wasteCost$/, "netSales")
    const netSalesColumn = result.columns.find(
      (column) => column.kind === "metric" && column.key === netSalesKey,
    )

    if (!netSalesColumn) continue

    const pctKey = wasteCostKey.replace(/wasteCost$/, "wasteCostPctOfSales")
    const pctColumn: ReportColumn = {
      kind: "metric",
      key: pctKey,
      metric: WASTE_COST_PCT_METRIC,
      ...(wasteCostColumn.pivot ? { pivot: wasteCostColumn.pivot } : {}),
      label: "",
    }
    pctColumn.label = formatReportColumn(pctColumn)
    pctColumns.push(pctColumn)
    keyPairs.push({ wasteCostKey, netSalesKey, pctKey })
  }

  const newRows = result.rows.map((row) => {
    const next = { ...row }
    for (const { wasteCostKey, netSalesKey, pctKey } of keyPairs) {
      const wasteCost = Number(row[wasteCostKey] ?? 0)
      const netSales = Number(row[netSalesKey] ?? 0)
      next[pctKey] = netSales === 0 ? null : (wasteCost / netSales) * 100
    }
    return next
  })

  return { ...result, columns: [...result.columns, ...pctColumns], rows: newRows }
}

const appendLaborHourVarianceMetric = (result: ReportQueryResult): ReportQueryResult => {
  const reportedColumns = result.columns.filter(
    (column) => column.kind === "metric" && column.metric === REPORTED_METRIC,
  )

  if (reportedColumns.length === 0) return result

  const varianceColumns: ReportColumn[] = []
  const keyPairs: Array<{
    reportedKey: string
    templateKey: string
    varianceKey: string
  }> = []

  for (const reportedColumn of reportedColumns) {
    if (reportedColumn.kind !== "metric") continue
    const reportedKey = reportedColumn.key
    const templateKey = reportedKey.replace(/reportedLaborHours$/, "templateLaborHours")
    const templateColumn = result.columns.find(
      (column) => column.kind === "metric" && column.key === templateKey,
    )

    if (!templateColumn) continue

    const varianceKey = reportedKey.replace(/reportedLaborHours$/, "laborHourVariance")
    const varianceColumn: ReportColumn = {
      kind: "metric",
      key: varianceKey,
      metric: VARIANCE_METRIC,
      ...(reportedColumn.pivot ? { pivot: reportedColumn.pivot } : {}),
      label: "",
    }
    varianceColumn.label = formatReportColumn(varianceColumn)
    varianceColumns.push(varianceColumn)
    keyPairs.push({ reportedKey, templateKey, varianceKey })
  }

  const newRows = result.rows.map((row) => {
    const next = { ...row }
    for (const { reportedKey, templateKey, varianceKey } of keyPairs) {
      const reported = row[reportedKey]
      const template = row[templateKey]
      next[varianceKey] = Number(reported ?? 0) - Number(template ?? 0)
    }
    return next
  })

  return { ...result, columns: [...result.columns, ...varianceColumns], rows: newRows }
}

const runMixedReportQuery = async (
  db: DbClient,
  customerId: string,
  config: ReportQueryInput,
): Promise<ReportQueryResult> => {
  for (const dimension of config.rows) {
    if (!isSharedDimension(dimension)) {
      throw DomainError.makeError({
        code: "BAD_REQUEST",
        message: `Dimension ${dimension} cannot be a row dimension when combining labor + sales metrics`,
        clientSafeMessage: `Move "${dimension}" to columns or remove it when combining labor and sales metrics. Only Location, Sale Date, Day of Week, Year, Week, or Month can be used as row dimensions in mixed reports.`,
        additionalContext: { dimension },
      })
    }
  }

  const groups = splitMetricsBySource(config.metrics)
  const wantsVariance = groups.derivedLabor.includes(VARIANCE_METRIC)
  const wantsVariancePercent = groups.derivedLabor.includes(VARIANCE_PERCENT_METRIC)
  const wantsPayrollPct = groups.derivedLabor.includes(PAYROLL_PCT_METRIC)
  const wantsWastePct = groups.derivedWaste.includes(WASTE_COST_PCT_METRIC)
  const needsReported = wantsVariance || wantsVariancePercent
  const needsTemplate = wantsVariance || wantsVariancePercent
  const needsPayroll = wantsPayrollPct
  const needsNetSalesForPct = wantsWastePct || wantsPayrollPct

  const timecardMetrics = [
    ...groups.timecard,
    ...(needsReported && !groups.timecard.includes(REPORTED_METRIC) ? [REPORTED_METRIC] : []),
    ...(needsPayroll && !groups.timecard.includes(PAYROLL_METRIC) ? [PAYROLL_METRIC] : []),
  ]
  const scheduledMetrics =
    needsTemplate && !groups.scheduled.includes(TEMPLATE_METRIC)
      ? [...groups.scheduled, TEMPLATE_METRIC]
      : groups.scheduled
  const wasteMetrics =
    wantsWastePct && !groups.waste.includes(WASTE_COST_METRIC)
      ? [...groups.waste, WASTE_COST_METRIC]
      : groups.waste
  const salesMetrics =
    needsNetSalesForPct && !groups.sales.includes(NET_SALES_METRIC)
      ? [...groups.sales, NET_SALES_METRIC]
      : groups.sales

  const salesColumns = config.columns.filter(
    (dimension) =>
      !LABOR_ONLY_DIMENSIONS.has(dimension) && !LINEITEMS_ONLY_DIMENSIONS.has(dimension),
  )
  const laborColumns = config.columns.filter((dimension) => !SALES_ONLY_DIMENSIONS.has(dimension))
  const wasteColumns = config.columns.filter(
    (dimension) => !LABOR_ONLY_DIMENSIONS.has(dimension) && !SALES_ONLY_DIMENSIONS.has(dimension),
  )
  const lineItemsColumns = config.columns.filter(
    (dimension) => !LABOR_ONLY_DIMENSIONS.has(dimension) && !ORDERS_ONLY_DIMENSIONS.has(dimension),
  )
  const salesFilters = config.filters.filter(
    (filter) =>
      !LABOR_ONLY_DIMENSIONS.has(filter.dimension) &&
      !LINEITEMS_ONLY_DIMENSIONS.has(filter.dimension),
  )
  const laborFilters = config.filters.filter(
    (filter) => !SALES_ONLY_DIMENSIONS.has(filter.dimension),
  )
  const wasteFilters = config.filters.filter(
    (filter) =>
      !LABOR_ONLY_DIMENSIONS.has(filter.dimension) && !SALES_ONLY_DIMENSIONS.has(filter.dimension),
  )
  const lineItemsFilters = config.filters.filter(
    (filter) =>
      !LABOR_ONLY_DIMENSIONS.has(filter.dimension) && !ORDERS_ONLY_DIMENSIONS.has(filter.dimension),
  )

  const subConfigBase: ReportQueryInput = {
    ...config,
    comparisons: undefined,
    locationAttributes: undefined,
    inlineYtdMetrics: undefined,
    channelBreakdownMetrics: undefined,
    comparisonDateRange: undefined,
    comparisonMetrics: undefined,
    page: 1,
  }

  const queries: Array<Promise<ReportQueryResult>> = []
  if (salesMetrics.length > 0) {
    queries.push(
      buildReportQuery(db, customerId, {
        ...subConfigBase,
        metrics: salesMetrics,
        columns: salesColumns,
        filters: salesFilters,
      }),
    )
  }
  if (timecardMetrics.length > 0) {
    queries.push(
      buildReportQuery(db, customerId, {
        ...subConfigBase,
        metrics: timecardMetrics,
        columns: laborColumns,
        filters: laborFilters,
      }),
    )
  }
  if (scheduledMetrics.length > 0) {
    queries.push(
      buildReportQuery(db, customerId, {
        ...subConfigBase,
        metrics: scheduledMetrics,
        columns: laborColumns,
        filters: laborFilters,
      }),
    )
  }
  if (wasteMetrics.length > 0) {
    queries.push(
      buildReportQuery(db, customerId, {
        ...subConfigBase,
        metrics: wasteMetrics,
        columns: wasteColumns,
        filters: wasteFilters,
      }),
    )
  }
  if (groups.lineItems.length > 0) {
    queries.push(
      buildReportQuery(db, customerId, {
        ...subConfigBase,
        metrics: groups.lineItems,
        columns: lineItemsColumns,
        filters: lineItemsFilters,
      }),
    )
  }

  const results = await Promise.all(queries)
  const [firstResult, ...remainingResults] = results
  let merged = remainingResults.reduce(
    (accumulated, current) => mergeReportResults(config, accumulated, current),
    firstResult!,
  )

  if (wantsVariance) {
    merged = appendLaborHourVarianceMetric(merged)
  }

  if (wantsVariancePercent) {
    merged = appendLaborHourVariancePercentMetric(merged)
  }

  if (wantsPayrollPct) {
    merged = appendPayrollPctOfSalesMetric(merged)
  }

  if (wantsWastePct) {
    merged = appendWasteCostPctOfSalesMetric(merged)
  }

  const injectedReported = needsReported && !groups.timecard.includes(REPORTED_METRIC)
  const injectedTemplate = needsTemplate && !groups.scheduled.includes(TEMPLATE_METRIC)
  const injectedPayroll = needsPayroll && !groups.timecard.includes(PAYROLL_METRIC)
  const injectedNetSales = needsNetSalesForPct && !groups.sales.includes(NET_SALES_METRIC)
  const injectedWasteCost = wantsWastePct && !groups.waste.includes(WASTE_COST_METRIC)

  const shouldStripInjected =
    injectedReported || injectedTemplate || injectedPayroll || injectedNetSales || injectedWasteCost

  if (shouldStripInjected) {
    merged = stripUnrequestedMetricColumns(merged, config.metrics)
  }

  const withSummary = config.comparisons
    ? await (async () => {
        const summaryRows = await computeSummaryRows(db, customerId, config, config.comparisons!)
        return summaryRows.length > 0 ? { ...merged, summaryRows } : merged
      })()
    : merged

  const withChannelBreakdown = await appendChannelBreakdownColumns(
    db,
    customerId,
    config,
    withSummary,
  )
  const withYtd = await appendInlineYtdColumns(db, customerId, config, withChannelBreakdown)
  const withComparison = await appendComparisonColumns(db, customerId, config, withYtd)
  const enriched = await enrichLocationAttributes(db, customerId, config, withComparison)
  return reorderColumnsByMetricSequence(enriched, config.metrics)
}
