import type { DbClient } from "../../../db/client"
import { type CustomerDto, customers } from "../schema"

export const listCustomers = async (db: DbClient): Promise<CustomerDto[]> => {
  return db.select().from(customers)
}
