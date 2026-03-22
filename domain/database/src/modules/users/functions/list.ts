import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type UserDto, users } from "../schema"

export const listUsers = async (db: DbClient, customerId: string): Promise<UserDto[]> => {
  return db.select().from(users).where(eq(users.customerId, customerId))
}
