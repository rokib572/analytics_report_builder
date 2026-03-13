import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const getCustomer = async (db: DbClient, id: string) => {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id))
  return customer ?? null
}

export const getCustomerBySlug = async (db: DbClient, slug: string) => {
  const [customer] = await db.select().from(customers).where(eq(customers.slug, slug))
  return customer ?? null
}
