import type { DbClient } from "../../../db/client"
import { type CustomerPayload, type CustomerDto, customers } from "../schema"

export const createCustomer = async (db: DbClient, data: CustomerPayload): Promise<CustomerDto> => {
  const [customer] = await db.insert(customers).values(data).returning()
  return customer!
}
