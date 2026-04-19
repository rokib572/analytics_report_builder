import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type UserDto, type UserUpdatePayload, users } from "../schema"

export const updateUser = async (
  db: DbClient,
  customerId: string,
  id: string,
  data: UserUpdatePayload,
): Promise<UserDto | null> => {
  const customerClause = eq(users.customerId, customerId)
  const conditions = [eq(users.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(whereClause)
    .returning()

  return user ?? null
}
