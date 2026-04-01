import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { catalogItemVariations } from "../schema"

export const findCatalogItemVariationIdBySquareId = async (
  db: DbClient,
  customerId: string,
  squareId: string,
): Promise<string | null> => {
  const customerClause = eq(catalogItemVariations.customerId, customerId)
  const conditions = [eq(catalogItemVariations.squareId, squareId)]
  const whereClause = and(customerClause, ...conditions)

  const [variation] = await db
    .select({ id: catalogItemVariations.id })
    .from(catalogItemVariations)
    .where(whereClause)
    .limit(1)

  return variation?.id ?? null
}
