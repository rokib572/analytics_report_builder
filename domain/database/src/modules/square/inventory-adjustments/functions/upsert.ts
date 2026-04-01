import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryAdjustmentPayload, inventoryAdjustments } from "../schema"

type InventoryAdjustmentRow = typeof inventoryAdjustments.$inferSelect

export const upsertInventoryAdjustment = async (
  db: DbClient,
  customerId: string,
  data: InventoryAdjustmentPayload,
): Promise<InventoryAdjustmentRow | undefined> => {
  const [adjustment] = await db
    .insert(inventoryAdjustments)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: inventoryAdjustments.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        catalogObjectId: sql`excluded.catalog_object_id`,
        catalogItemVariationId: sql`excluded.catalog_item_variation_id`,
        catalogObjectType: sql`excluded.catalog_object_type`,
        fromState: sql`excluded.from_state`,
        toState: sql`excluded.to_state`,
        quantity: sql`excluded.quantity`,
        totalPriceMoney: sql`excluded.total_price_money`,
        occurredAt: sql`excluded.occurred_at`,
        createdAt: sql`excluded.created_at`,
        teamMemberId: sql`excluded.team_member_id`,
        transactionId: sql`excluded.transaction_id`,
        refundId: sql`excluded.refund_id`,
        purchaseOrderId: sql`excluded.purchase_order_id`,
        goodsReceiptId: sql`excluded.goods_receipt_id`,
        reason: sql`excluded.reason`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${inventoryAdjustments.contentHash}`,
    })
    .returning()

  return adjustment
}
