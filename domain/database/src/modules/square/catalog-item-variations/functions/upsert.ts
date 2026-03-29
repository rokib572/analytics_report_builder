import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import {
  type CatalogItemVariationDto,
  type CatalogItemVariationPayload,
  catalogItemVariations,
} from "../schema"

export const upsertCatalogItemVariation = async (
  db: DbClient,
  customerId: string,
  data: CatalogItemVariationPayload,
): Promise<CatalogItemVariationDto | undefined> => {
  const [variation] = await db
    .insert(catalogItemVariations)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogItemVariations.squareId,
      set: {
        itemId: sql`excluded.item_id`,
        name: sql`excluded.name`,
        sku: sql`excluded.sku`,
        priceMoney: sql`excluded.price_money`,
        priceCurrency: sql`excluded.price_currency`,
        ordinal: sql`excluded.ordinal`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogItemVariations.contentHash}`,
    })
    .returning()
  return variation
}
