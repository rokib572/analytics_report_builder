import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { catalogModifierLists } from "../schema"

export const findCatalogModifierListIdBySquareId = async (
  db: DbClient,
  customerId: string,
  squareId: string,
): Promise<string | null> => {
  const customerClause = eq(catalogModifierLists.customerId, customerId)
  const conditions = [eq(catalogModifierLists.squareId, squareId)]
  const whereClause = and(customerClause, ...conditions)

  const [modifierList] = await db
    .select({ id: catalogModifierLists.id })
    .from(catalogModifierLists)
    .where(whereClause)
    .limit(1)

  return modifierList?.id ?? null
}
