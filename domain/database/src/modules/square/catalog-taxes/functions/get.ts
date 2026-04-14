import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogTaxDto, catalogTaxes } from "../schema"

export const getCatalogTax = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogTaxDto | undefined> => {
  const customerClause = eq(catalogTaxes.customerId, customerId)
  const conditions = [eq(catalogTaxes.id, id)]
  const [tax] = await db
    .select()
    .from(catalogTaxes)
    .where(and(customerClause, ...conditions))

  return tax
}
