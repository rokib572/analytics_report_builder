import type { DbClient } from "../../../db/client"
import { customers } from "../schema"

export const createCustomer = async (
  db: DbClient,
  data: {
    name: string
    slug: string
    companyName?: string
    businessType?: string
    businessSize?: string
    phone?: string
    address?: string
  },
) => {
  const [customer] = await db.insert(customers).values(data).returning()
  return customer
}
