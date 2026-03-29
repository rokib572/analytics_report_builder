import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogCategoryDto, catalogCategories } from "../schema"

export const getCatalogCategory = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogCategoryDto | undefined> => {
  const customerClause = eq(catalogCategories.customerId, customerId)
  const conditions = [eq(catalogCategories.id, id)]
  const [category] = await db
    .select()
    .from(catalogCategories)
    .where(and(customerClause, ...conditions))
  return category
}
