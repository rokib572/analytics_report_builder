import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { users } from "../schema"

export const listUsers = async (db: DbClient, customerId: string) => {
  return db.select().from(users).where(eq(users.customerId, customerId))
}
