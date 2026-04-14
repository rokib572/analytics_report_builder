import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogDiscountDto, catalogDiscounts } from "../schema"

export const getCatalogDiscount = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<CatalogDiscountDto | undefined> => {
  const customerClause = eq(catalogDiscounts.customerId, customerId)
  const conditions = [eq(catalogDiscounts.id, id)]
  const [discount] = await db
    .select()
    .from(catalogDiscounts)
    .where(and(customerClause, ...conditions))

  return discount
}
