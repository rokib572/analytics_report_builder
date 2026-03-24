import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { baUser } from "../schema"

export const baUserExistsByEmail = async (
  db: DbClient,
  query: { email: string },
): Promise<boolean> => {
  const [existing] = await db
    .select({ id: baUser.id })
    .from(baUser)
    .where(eq(baUser.email, query.email))
    .limit(1)

  return !!existing
}
