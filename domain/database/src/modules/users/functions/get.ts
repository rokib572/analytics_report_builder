import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type UserDto, users } from "../schema"

export const getUser = async (
  db: DbClient,
  query: { customerId: string; id: string },
): Promise<UserDto | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.customerId, query.customerId), eq(users.id, query.id)))
    .limit(1)

  return user ?? null
}

export const getUserByBetterAuthId = async (
  db: DbClient,
  query: { betterAuthUserId: string },
): Promise<UserDto | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, query.betterAuthUserId))
    .limit(1)

  return user ?? null
}

export const getUsersByBetterAuthId = async (
  db: DbClient,
  query: { betterAuthUserId: string },
): Promise<UserDto[]> => {
  return db.select().from(users).where(eq(users.betterAuthUserId, query.betterAuthUserId))
}

export const getUserByEmail = async (
  db: DbClient,
  query: { customerId: string; email: string },
): Promise<UserDto | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.customerId, query.customerId), eq(users.email, query.email)))
    .limit(1)

  return user ?? null
}
