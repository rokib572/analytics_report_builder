import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogCategoryDto, type CatalogCategoryPayload, catalogCategories } from "../schema"

export const upsertCatalogCategory = async (
  db: DbClient,
  customerId: string,
  data: CatalogCategoryPayload,
): Promise<CatalogCategoryDto | undefined> => {
  const [category] = await db
    .insert(catalogCategories)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogCategories.squareId,
      set: {
        name: sql`excluded.name`,
        parentCategoryId: sql`excluded.parent_category_id`,
        isTopLevel: sql`excluded.is_top_level`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogCategories.contentHash}`,
    })
    .returning()
  return category
}
