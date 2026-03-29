import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { catalogItemVariations } from "../schema"

export const deleteCatalogItemVariationsByItemId = async (
  db: DbClient,
  itemId: string,
): Promise<void> => {
  await db.delete(catalogItemVariations).where(eq(catalogItemVariations.itemId, itemId))
}
