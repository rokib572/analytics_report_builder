import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type CustomerDto, customers } from "../schema"

export const getCustomer = async (
  db: DbClient,
  customerId: string,
): Promise<CustomerDto | null> => {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId))
  return customer
}
