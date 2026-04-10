import { and, desc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncLog } from "../schema"

export const getLatestBackfill = async (db: DbClient, customerId: string) => {
  const customerClause = eq(syncLog.customerId, customerId)
  const conditions = [eq(syncLog.syncType, "backfill")]
  const whereClause = and(customerClause, ...conditions)

  const [row] = await db
    .select()
    .from(syncLog)
    .where(whereClause)
    .orderBy(desc(syncLog.updatedAt), desc(syncLog.createdAt))
    .limit(1)

  return row ?? null
}
