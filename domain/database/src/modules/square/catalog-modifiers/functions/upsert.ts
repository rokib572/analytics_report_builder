import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogModifierDto, type CatalogModifierPayload, catalogModifiers } from "../schema"

export const upsertCatalogModifier = async (
  db: DbClient,
  customerId: string,
  data: CatalogModifierPayload,
): Promise<CatalogModifierDto | undefined> => {
  const [modifier] = await db
    .insert(catalogModifiers)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogModifiers.squareId,
      set: {
        modifierListId: sql`excluded.modifier_list_id`,
        name: sql`excluded.name`,
        priceMoney: sql`excluded.price_money`,
        priceCurrency: sql`excluded.price_currency`,
        ordinal: sql`excluded.ordinal`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogModifiers.contentHash}`,
    })
    .returning()

  return modifier
}
