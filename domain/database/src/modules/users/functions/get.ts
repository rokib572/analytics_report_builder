import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { users } from "../schema"

export const getUser = async (db: DbClient, customerId: string, id: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.customerId, customerId), eq(users.id, id)))
  return user ?? null
}

export const getUserByBetterAuthId = async (db: DbClient, betterAuthUserId: string) => {
  const [user] = await db.select().from(users).where(eq(users.betterAuthUserId, betterAuthUserId))
  return user ?? null
}

export const getUserByEmail = async (db: DbClient, customerId: string, email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.customerId, customerId), eq(users.email, email)))
  return user ?? null
}
