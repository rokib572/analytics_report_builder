import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type RefundPayload, refunds } from "../schema"

type RefundRow = typeof refunds.$inferSelect

export const upsertRefund = async (
  db: DbClient,
  customerId: string,
  data: RefundPayload,
): Promise<RefundRow | undefined> => {
  const [refund] = await db
    .insert(refunds)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: refunds.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        paymentId: sql`excluded.payment_id`,
        orderId: sql`excluded.order_id`,
        status: sql`excluded.status`,
        amountMoney: sql`excluded.amount_money`,
        appFeeMoney: sql`excluded.app_fee_money`,
        processingFeeMoney: sql`excluded.processing_fee_money`,
        reason: sql`excluded.reason`,
        destinationType: sql`excluded.destination_type`,
        unlinked: sql`excluded.unlinked`,
        teamMemberId: sql`excluded.team_member_id`,
        squareCustomerId: sql`excluded.square_customer_id`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
        createdAt: sql`excluded.created_at`,
        updatedAt: sql`excluded.updated_at`,
      },
      setWhere: sql`excluded.content_hash <> ${refunds.contentHash}`,
    })
    .returning()

  return refund
}
