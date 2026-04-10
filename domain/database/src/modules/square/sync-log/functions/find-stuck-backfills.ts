import { and, asc, eq, inArray, lt } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncLog } from "../schema"

export const findStuckBackfills = async (db: DbClient, staleBefore: Date) => {
  const conditions = [
    eq(syncLog.syncType, "backfill"),
    inArray(syncLog.status, ["pending", "running"]),
    lt(syncLog.updatedAt, staleBefore),
  ]
  const whereClause = and(...conditions)

  return db
    .select()
    .from(syncLog)
    .where(whereClause)
    .orderBy(asc(syncLog.updatedAt), asc(syncLog.createdAt))
}
