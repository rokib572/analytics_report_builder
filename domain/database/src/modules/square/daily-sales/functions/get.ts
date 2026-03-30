import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { type DailySalesDto, dailySales } from "../schema"

export const getDailySales = async (
  db: DbClient,
  customerId: string,
  locationId: string,
  date: string,
): Promise<DailySalesDto | undefined> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [eq(dailySales.locationId, locationId), eq(dailySales.saleDate, date)]

  const rows = await db
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
    .where(and(customerClause, ...conditions))

  return rows[0]
}
