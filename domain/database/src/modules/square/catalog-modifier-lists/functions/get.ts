import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogModifierListDto, catalogModifierLists } from "../schema"

export const getCatalogModifierList = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogModifierListDto | undefined> => {
  const customerClause = eq(catalogModifierLists.customerId, customerId)
  const conditions = [eq(catalogModifierLists.id, id)]
  const [modifierList] = await db
    .select()
    .from(catalogModifierLists)
    .where(and(customerClause, ...conditions))

  return modifierList
}
