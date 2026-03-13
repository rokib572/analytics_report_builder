import type { DbClient } from "../../../db/client"
import { users } from "../schema"

export const createUser = async (
  db: DbClient,
  data: {
    customerId: string
    email: string
    name: string
    role?: string
    betterAuthUserId?: string
  },
) => {
  const [user] = await db.insert(users).values(data).returning()
  return user
}
