import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type CustomerDto, customers } from "../schema"

export const getCustomerBySlug = async (
  db: DbClient,
  query: { slug: string; customerId: string },
): Promise<CustomerDto | null> => {
  const { slug, customerId } = query
  const customerClause = eq(customers.id, customerId)
  const slugClause = [eq(customers.slug, slug)]
  const whereClause = and(customerClause, ...slugClause)

  const [customer] = await db.select().from(customers).where(whereClause)
  return customer ?? null
}
