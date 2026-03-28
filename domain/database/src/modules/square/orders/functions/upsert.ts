import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type OrderPayload, orders } from "../schema"

type OrderRow = typeof orders.$inferSelect

export const upsertOrder = async (
  db: DbClient,
  customerId: string,
  data: OrderPayload,
): Promise<OrderRow | undefined> => {
  const [order] = await db
    .insert(orders)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: orders.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        saleDate: sql`excluded.sale_date`,
        state: sql`excluded.state`,
        totalMoney: sql`excluded.total_money`,
        totalTaxMoney: sql`excluded.total_tax_money`,
        totalDiscountMoney: sql`excluded.total_discount_money`,
        totalTipMoney: sql`excluded.total_tip_money`,
        totalServiceChargeMoney: sql`excluded.total_service_charge_money`,
        netAmounts: sql`excluded.net_amounts`,
        returnAmounts: sql`excluded.return_amounts`,
        sourceName: sql`excluded.source_name`,
        rawJson: sql`excluded.raw_json`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
        updatedAt: sql`excluded.updated_at`,
      },
      setWhere: sql`excluded.content_hash <> ${orders.contentHash}`,
    })
    .returning()
  return order
}
