import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const listCustomers = async (db: DbClient) => {
  return db.select().from(customers)
}
