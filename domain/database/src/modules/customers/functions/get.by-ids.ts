import { inArray } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const getCustomersByIds = async (
  db: DbClient,
  customerIds: string[],
): Promise<{ id: string; name: string; companyName: string | null }[]> => {
  if (customerIds.length === 0) return []

  return db
    .select({ id: customers.id, name: customers.name, companyName: customers.companyName })
    .from(customers)
    .where(inArray(customers.id, customerIds))
}
