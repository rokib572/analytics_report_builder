import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type CustomerDto, type UpdateCustomerPayload, customers } from "../schema"

export const updateCustomer = async (
  db: DbClient,
  customerId: string,
  data: UpdateCustomerPayload,
): Promise<CustomerDto | null> => {
  const [customer] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, customerId))
    .returning()

  return customer!
}
