import type { DbClient } from "../../../db/client"
import { type UserDto, type UserPayload, users } from "../schema"

export const createUser = async (
  db: DbClient,
  customerId: string,
  data: UserPayload,
): Promise<UserDto> => {
  const [user] = await db
    .insert(users)
    .values({ ...data, customerId })
    .returning()
  return user!
}
