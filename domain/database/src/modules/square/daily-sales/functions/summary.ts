import { and, eq, gte, lte, sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { dailySales } from "../schema"
import type { DailySalesSummary, MonthlySalesChartRow } from "../types"

export const getDailySalesSummary = async (
  db: DbClient,
  customerId: string,
  options: { dateFrom: string; dateTo: string },
): Promise<DailySalesSummary> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [
    gte(dailySales.saleDate, options.dateFrom),
    lte(dailySales.saleDate, options.dateTo),
  ]
  const whereClause = and(customerClause, ...conditions)

  const [row] = await db
    .select({
      netSales: sql<bigint>`coalesce(sum(${dailySales.netSales}), 0)`,
      grossSales: sql<bigint>`coalesce(sum(${dailySales.grossSales}), 0)`,
      orderCount: sql<number>`coalesce(sum(${dailySales.orderCount}), 0)`,
      totalTax: sql<bigint>`coalesce(sum(${dailySales.totalTax}), 0)`,
      totalTips: sql<bigint>`coalesce(sum(${dailySales.totalTips}), 0)`,
      totalCollected: sql<bigint>`coalesce(sum(${dailySales.totalCollected}), 0)`,
      totalDiscounts: sql<bigint>`coalesce(sum(${dailySales.totalDiscounts}), 0)`,
    })
    .from(dailySales)
    .innerJoin(locations, eq(dailySales.locationId, locations.id))
    .where(whereClause)

  return {
    netSales: row?.netSales ?? 0n,
    grossSales: row?.grossSales ?? 0n,
    orderCount: Number(row?.orderCount ?? 0),
    totalTax: row?.totalTax ?? 0n,
    totalTips: row?.totalTips ?? 0n,
    totalCollected: row?.totalCollected ?? 0n,
    totalDiscounts: row?.totalDiscounts ?? 0n,
  }
}

export const getMonthlySalesChart = async (
  db: DbClient,
  customerId: string,
  options: { dateFrom: string; dateTo: string },
): Promise<MonthlySalesChartRow[]> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [
    gte(dailySales.saleDate, options.dateFrom),
    lte(dailySales.saleDate, options.dateTo),
  ]
  const whereClause = and(customerClause, ...conditions)

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${dailySales.saleDate}::timestamp), 'YYYY-MM-01')`,
      total: sql<bigint>`coalesce(sum(${dailySales.netSales}), 0)`,
    })
    .from(dailySales)
    .innerJoin(locations, eq(dailySales.locationId, locations.id))
    .where(whereClause)
    .groupBy(sql`date_trunc('month', ${dailySales.saleDate}::timestamp)`)
    .orderBy(sql`date_trunc('month', ${dailySales.saleDate}::timestamp) asc`)

  return rows.map((row) => ({
    month: row.month,
    total: row.total ?? 0n,
  }))
}
