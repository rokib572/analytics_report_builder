import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const updateCustomer = async (
  db: DbClient,
  id: string,
  data: {
    companyName?: string
    businessType?: string
    businessSize?: string
    phone?: string
    address?: string
  },
) => {
  const [customer] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning()
  return customer ?? null
}
