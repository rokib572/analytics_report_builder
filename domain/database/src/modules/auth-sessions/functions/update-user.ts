import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { baUser } from "../schema"

export const updateBaUser = async (
  db: DbClient,
  id: string,
  data: { name?: string },
): Promise<{ id: string } | null> => {
  const [user] = await db
    .update(baUser)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(baUser.id, id))
    .returning({ id: baUser.id })

  return user ?? null
}
