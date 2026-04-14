import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogModifierDto, catalogModifiers } from "../schema"

export const getCatalogModifier = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogModifierDto | undefined> => {
  const customerClause = eq(catalogModifiers.customerId, customerId)
  const conditions = [eq(catalogModifiers.id, id)]
  const [modifier] = await db
    .select()
    .from(catalogModifiers)
    .where(and(customerClause, ...conditions))

  return modifier
}
