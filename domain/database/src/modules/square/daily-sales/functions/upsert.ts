import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type DailySalesDto, type DailySalesPayload, dailySales } from "../schema"
import { validateLocation } from "./create.validate-location"

export const upsertDailySales = async (
  db: DbClient,
  customerId: string,
  data: DailySalesPayload,
): Promise<DailySalesDto | undefined> => {
  await validateLocation(db, customerId, data.locationId)

  const [row] = await db
    .insert(dailySales)
    .values({ ...data, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: [dailySales.locationId, dailySales.saleDate],
      set: {
        grossSales: sql`excluded.gross_sales`,
        totalDiscounts: sql`excluded.total_discounts`,
        totalReturns: sql`excluded.total_returns`,
        netSales: sql`excluded.net_sales`,
        totalTax: sql`excluded.total_tax`,
        totalTips: sql`excluded.total_tips`,
        totalServiceCharges: sql`excluded.total_service_charges`,
        totalCollected: sql`excluded.total_collected`,
        storeGrossSales: sql`excluded.store_gross_sales`,
        uberGrossSales: sql`excluded.uber_gross_sales`,
        uberBogoDiscountAmount: sql`excluded.uber_bogo_discount_amount`,
        uberBogoRecoverable: sql`excluded.uber_bogo_recoverable`,
        orderCount: sql`excluded.order_count`,
        syncedAt: sql`excluded.synced_at`,
        syncSource: sql`excluded.sync_source`,
      },
    })
    .returning()

  return row
}
