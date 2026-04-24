import type { AnyPgColumn } from "drizzle-orm/pg-core"
import type { Dimension, QueryMode, SupportedMetric } from "@analytics/report-builder"
import type { DimensionDefinition, MetricDefinition } from "./type"
import {
  dailySalesDimensionMap,
  dailySalesFilterColumns,
  dailySalesMetricMap,
  lineItemsDimensionMap,
  lineItemsFilterColumns,
  lineItemsMetricMap,
  ordersDimensionMap,
  ordersFilterColumns,
  ordersMetricMap,
  tendersDimensionMap,
  tendersFilterColumns,
  tendersMetricMap,
} from "./util"

export const getModeConfig = (
  mode: QueryMode,
): {
  metricMap: Record<SupportedMetric, MetricDefinition>
  dimensionMap: Partial<Record<Dimension, DimensionDefinition>>
  filterColumns: Partial<Record<Dimension, AnyPgColumn>>
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
