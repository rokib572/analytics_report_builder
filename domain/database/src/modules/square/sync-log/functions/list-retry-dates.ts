import { and, desc, eq, gte, inArray } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncLog } from "../schema"

export const listRetryDates = async (
  db: DbClient,
  customerId: string,
  syncType: string,
  dateFloor: string,
) => {
  const customerClause = eq(syncLog.customerId, customerId)
  const conditions = [
    eq(syncLog.syncType, syncType),
    gte(syncLog.dateFrom, dateFloor),
    inArray(syncLog.status, ["error", "pending", "running", "repaired"]),
  ]
  const whereClause = and(customerClause, ...conditions)

  const rows = await db
    .select({ dateFrom: syncLog.dateFrom })
    .from(syncLog)
    .where(whereClause)
    .orderBy(desc(syncLog.dateFrom), desc(syncLog.updatedAt))

  return [...new Set(rows.map((row) => row.dateFrom))]
}
