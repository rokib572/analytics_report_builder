import { asc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { catalogCategories } from "../schema"

export const listCatalogCategories = async (
  db: DbClient,
  customerId: string,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ name: catalogCategories.name })
    .from(catalogCategories)
    .where(eq(catalogCategories.customerId, customerId))
    .orderBy(asc(catalogCategories.name))

  return rows.map((row) => row.name).filter((name): name is string => Boolean(name))
}
