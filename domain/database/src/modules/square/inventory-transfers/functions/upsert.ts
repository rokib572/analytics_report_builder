import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryTransferPayload, inventoryTransfers } from "../schema"

type InventoryTransferRow = typeof inventoryTransfers.$inferSelect

export const upsertInventoryTransfer = async (
  db: DbClient,
  customerId: string,
  data: InventoryTransferPayload,
): Promise<InventoryTransferRow | undefined> => {
  const [transfer] = await db
    .insert(inventoryTransfers)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: inventoryTransfers.squareId,
      set: {
        catalogObjectId: sql`excluded.catalog_object_id`,
        catalogItemVariationId: sql`excluded.catalog_item_variation_id`,
        catalogObjectType: sql`excluded.catalog_object_type`,
        fromLocationId: sql`excluded.from_location_id`,
        toLocationId: sql`excluded.to_location_id`,
        fromSquareLocationId: sql`excluded.from_square_location_id`,
        toSquareLocationId: sql`excluded.to_square_location_id`,
        state: sql`excluded.state`,
        quantity: sql`excluded.quantity`,
        occurredAt: sql`excluded.occurred_at`,
        createdAt: sql`excluded.created_at`,
        teamMemberId: sql`excluded.team_member_id`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${inventoryTransfers.contentHash}`,
    })
    .returning()

  return transfer
}
