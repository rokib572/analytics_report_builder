import type { AnyPgColumn } from "drizzle-orm/pg-core"
import type { Dimension, QueryMode, SupportedMetric } from "@analytics/report-builder"
import type { DimensionDefinition, MetricDefinition } from "./type"
import {
  dailySalesDimensionMap,
  dailySalesFilterColumns,
  dailySalesMetricMap,
  laborDimensionMap,
  laborFilterColumns,
  laborMetricMap,
  lineItemsDimensionMap,
  lineItemsFilterColumns,
  lineItemsMetricMap,
  ordersDimensionMap,
  ordersFilterColumns,
  ordersMetricMap,
  scheduledDimensionMap,
  scheduledFilterColumns,
  scheduledMetricMap,
  tendersDimensionMap,
  tendersFilterColumns,
  tendersMetricMap,
  wasteDimensionMap,
  wasteFilterColumns,
  wasteMetricMap,
} from "./util"

export const getModeConfig = (
  mode: QueryMode,
): {
  metricMap: Partial<Record<SupportedMetric, MetricDefinition>>
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
    case "labor":
      return {
        metricMap: laborMetricMap,
        dimensionMap: laborDimensionMap,
        filterColumns: laborFilterColumns,
      }
    case "scheduled":
      return {
        metricMap: scheduledMetricMap,
        dimensionMap: scheduledDimensionMap,
        filterColumns: scheduledFilterColumns,
      }
    case "waste":
      return {
        metricMap: wasteMetricMap,
        dimensionMap: wasteDimensionMap,
        filterColumns: wasteFilterColumns,
      }
    default:
      return {
        metricMap: dailySalesMetricMap,
        dimensionMap: dailySalesDimensionMap,
        filterColumns: dailySalesFilterColumns,
      }
  }
}
