import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogItemDto, catalogItems } from "../schema"

export const getCatalogItem = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogItemDto | undefined> => {
  const customerClause = eq(catalogItems.customerId, customerId)
  const conditions = [eq(catalogItems.id, id)]
  const [item] = await db
    .select()
    .from(catalogItems)
    .where(and(customerClause, ...conditions))
  return item
}
