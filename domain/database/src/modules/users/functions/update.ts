import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { users } from "../schema"

export const updateUser = async (
  db: DbClient,
  customerId: string,
  id: string,
  data: { name?: string; role?: string; isActive?: boolean },
) => {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.customerId, customerId), eq(users.id, id)))
    .returning()
  return user ?? null
}
