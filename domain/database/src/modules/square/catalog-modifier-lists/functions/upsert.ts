import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import {
  type CatalogModifierListDto,
  type CatalogModifierListPayload,
  catalogModifierLists,
} from "../schema"

export const upsertCatalogModifierList = async (
  db: DbClient,
  customerId: string,
  data: CatalogModifierListPayload,
): Promise<CatalogModifierListDto | undefined> => {
  const [modifierList] = await db
    .insert(catalogModifierLists)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogModifierLists.squareId,
      set: {
        name: sql`excluded.name`,
        selectionType: sql`excluded.selection_type`,
        ordinal: sql`excluded.ordinal`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogModifierLists.contentHash}`,
    })
    .returning()

  return modifierList
}
