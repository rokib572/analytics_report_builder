import { sql } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import type { Dimension, SupportedMetric } from "@analytics/report-builder"
import { channels } from "../../channels/schema"
import { dailySales } from "../../daily-sales/schema"
import { catalogCategories } from "../../catalog-categories/schema"
import { locations } from "../../locations/schema"
import { orderLineItems } from "../../order-line-items/schema"
import { orderTenders } from "../../order-tenders/schema"
import { orders } from "../../orders/schema"
import { squareCustomers } from "../../customers/schema"
import type { DimensionDefinition, MetricDefinition } from "./type"

export const DEFAULT_REPORT_PAGE_SIZE = 10_000
export const MAX_REPORT_PAGE_SIZE = 50_000
export const PIVOT_SOURCE_ROW_MULTIPLIER = 50

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

const locationNameExpr = sql<string>`coalesce(${locations.name}, 'Unknown')`
const channelNameExpr = sql<string>`coalesce(${channels.displayName}, 'Unassigned')`

export const dailySalesMetricMap: Record<SupportedMetric, MetricDefinition> = {
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

export const lineItemsMetricMap: Record<SupportedMetric, MetricDefinition> = {
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

export const tendersMetricMap: Record<SupportedMetric, MetricDefinition> = {
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

export const ordersMetricMap: Record<SupportedMetric, MetricDefinition> = {
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
  extraDimensions: Partial<Record<Dimension, DimensionDefinition>> = {},
): Partial<Record<Dimension, DimensionDefinition>> => {
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
      select: locationNameExpr,
      groupBy: [locationColumn, locations.name],
      orderBy: locations.name,
      filterBy: locationColumn,
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

export const dailySalesDimensionMap = buildDimensionMap(dailySales.locationId, dailySales.saleDate)

export const lineItemsDimensionMap = buildDimensionMap(
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

export const tendersDimensionMap = buildDimensionMap(orderTenders.locationId, orders.saleDate, {
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

export const ordersDimensionMap = buildDimensionMap(orders.locationId, orders.saleDate, {
  customer: {
    select: customerNameExpr,
    groupBy: customerNameExpr,
    orderBy: customerNameExpr,
  },
  channel: {
    select: channelNameExpr,
    groupBy: [orders.channelId, channels.displayName],
    orderBy: channelNameExpr,
    filterBy: orders.channelId,
  },
})

export const dailySalesFilterColumns: Partial<Record<Dimension, AnyPgColumn>> = {
  locationId: dailySales.locationId,
  saleDate: dailySales.saleDate,
}

export const lineItemsFilterColumns: Partial<Record<Dimension, AnyPgColumn>> = {
  locationId: orderLineItems.locationId,
  saleDate: orderLineItems.saleDate,
  product: orderLineItems.name,
  productCategory: catalogCategories.name,
}

export const tendersFilterColumns: Partial<Record<Dimension, AnyPgColumn>> = {
  locationId: orderTenders.locationId,
  saleDate: orders.saleDate,
  paymentMethod: orderTenders.type,
}

export const ordersFilterColumns: Partial<Record<Dimension, AnyPgColumn>> = {
  locationId: orders.locationId,
  saleDate: orders.saleDate,
  channel: orders.channelId,
}
