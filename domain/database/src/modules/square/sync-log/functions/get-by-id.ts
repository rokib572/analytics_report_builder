import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncLog } from "../schema"

export const getSyncLogById = async (db: DbClient, id: string) => {
  const [row] = await db.select().from(syncLog).where(eq(syncLog.id, id)).limit(1)
  return row ?? null
}
