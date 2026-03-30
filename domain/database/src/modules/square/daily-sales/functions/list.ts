import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { dailySales } from "../schema"
import type { ListDailySalesOptions, ListDailySalesResult } from "../types"

export const listDailySales = async (
  db: DbClient,
  customerId: string,
  options: ListDailySalesOptions,
): Promise<ListDailySalesResult> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [eq(dailySales.locationId, options.locationId)]

  if (options.dateFrom) {
    conditions.push(gte(dailySales.saleDate, options.dateFrom))
  }
  if (options.dateTo) {
    conditions.push(lte(dailySales.saleDate, options.dateTo))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: dailySales.id,
        locationId: dailySales.locationId,
        saleDate: dailySales.saleDate,
        grossSales: dailySales.grossSales,
        totalDiscounts: dailySales.totalDiscounts,
        totalReturns: dailySales.totalReturns,
        netSales: dailySales.netSales,
        totalTax: dailySales.totalTax,
        totalTips: dailySales.totalTips,
        totalServiceCharges: dailySales.totalServiceCharges,
        totalCollected: dailySales.totalCollected,
        storeGrossSales: dailySales.storeGrossSales,
        uberGrossSales: dailySales.uberGrossSales,
        uberBogoDiscountAmount: dailySales.uberBogoDiscountAmount,
        uberBogoRecoverable: dailySales.uberBogoRecoverable,
        orderCount: dailySales.orderCount,
        syncedAt: dailySales.syncedAt,
        syncSource: dailySales.syncSource,
      })
      .from(dailySales)
      .innerJoin(locations, eq(dailySales.locationId, locations.id))
      .where(whereClause)
      .orderBy(desc(dailySales.saleDate))
      .limit(options.limit)
      .offset(offset),
    db
      .select({ totalCount: count() })
      .from(dailySales)
      .innerJoin(locations, eq(dailySales.locationId, locations.id))
      .where(whereClause),
  ])

  const [countResult] = countRows

  return {
    dailySales: rows,
    totalCount: countResult?.totalCount ?? 0,
  }
}
