import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogItemVariationDto, catalogItemVariations } from "../schema"

export const getCatalogItemVariation = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogItemVariationDto | undefined> => {
  const customerClause = eq(catalogItemVariations.customerId, customerId)
  const conditions = [eq(catalogItemVariations.id, id)]
  const [variation] = await db
    .select()
    .from(catalogItemVariations)
    .where(and(customerClause, ...conditions))
  return variation
}
