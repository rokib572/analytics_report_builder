import { and, count, desc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncLog } from "../schema"
import type { ListSyncLogsOptions, ListSyncLogsResult } from "../types"

export const listSyncLogs = async (
  db: DbClient,
  customerId: string,
  options: ListSyncLogsOptions,
): Promise<ListSyncLogsResult> => {
  const customerClause = eq(syncLog.customerId, customerId)
  const conditions = options.locationId ? [eq(syncLog.locationId, options.locationId)] : []
  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(syncLog)
      .where(whereClause)
      .orderBy(desc(syncLog.createdAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(syncLog).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    syncLogs: rows,
    totalCount: countResult?.totalCount ?? 0,
  }
}
