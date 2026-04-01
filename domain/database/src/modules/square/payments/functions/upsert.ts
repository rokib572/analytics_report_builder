import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type PaymentPayload, payments } from "../schema"

type PaymentRow = typeof payments.$inferSelect

export const upsertPayment = async (
  db: DbClient,
  customerId: string,
  data: PaymentPayload,
): Promise<PaymentRow | undefined> => {
  const [payment] = await db
    .insert(payments)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: payments.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        orderId: sql`excluded.order_id`,
        status: sql`excluded.status`,
        sourceType: sql`excluded.source_type`,
        amountMoney: sql`excluded.amount_money`,
        tipMoney: sql`excluded.tip_money`,
        totalMoney: sql`excluded.total_money`,
        appFeeMoney: sql`excluded.app_fee_money`,
        refundedMoney: sql`excluded.refunded_money`,
        processingFeeMoney: sql`excluded.processing_fee_money`,
        cardBrand: sql`excluded.card_brand`,
        cardLast4: sql`excluded.card_last4`,
        cardEntryMethod: sql`excluded.card_entry_method`,
        riskLevel: sql`excluded.risk_level`,
        squareCustomerId: sql`excluded.square_customer_id`,
        teamMemberId: sql`excluded.team_member_id`,
        deviceId: sql`excluded.device_id`,
        applicationId: sql`excluded.application_id`,
        receiptUrl: sql`excluded.receipt_url`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
        createdAt: sql`excluded.created_at`,
        updatedAt: sql`excluded.updated_at`,
      },
      setWhere: sql`excluded.content_hash <> ${payments.contentHash}`,
    })
    .returning()

  return payment
}
