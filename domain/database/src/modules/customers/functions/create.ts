import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const createCustomer = async (db: DbClient, data: { name: string; slug: string }) => {
  const [customer] = await db.insert(customers).values(data).returning()
  return customer
}
