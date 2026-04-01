import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryCountPayload, inventoryCounts } from "../schema"

type InventoryCountRow = typeof inventoryCounts.$inferSelect

export const upsertInventoryCount = async (
  db: DbClient,
  customerId: string,
  data: InventoryCountPayload,
): Promise<InventoryCountRow | undefined> => {
  const [count] = await db
    .insert(inventoryCounts)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: [inventoryCounts.locationId, inventoryCounts.catalogObjectId, inventoryCounts.state],
      set: {
        catalogItemVariationId: sql`excluded.catalog_item_variation_id`,
        catalogObjectType: sql`excluded.catalog_object_type`,
        quantity: sql`excluded.quantity`,
        isEstimated: sql`excluded.is_estimated`,
        calculatedAt: sql`excluded.calculated_at`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${inventoryCounts.contentHash}`,
    })
    .returning()

  return count
}
