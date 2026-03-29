import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogItemDto, type CatalogItemPayload, catalogItems } from "../schema"

export const upsertCatalogItem = async (
  db: DbClient,
  customerId: string,
  data: CatalogItemPayload,
): Promise<CatalogItemDto | undefined> => {
  const [item] = await db
    .insert(catalogItems)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogItems.squareId,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        categoryId: sql`excluded.category_id`,
        isArchived: sql`excluded.is_archived`,
        reportingCategoryId: sql`excluded.reporting_category_id`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogItems.contentHash}`,
    })
    .returning()
  return item
}
