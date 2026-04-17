import { and, count, desc, eq, inArray } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncRunDetails, syncRuns } from "../schema"
import type { ListSyncRunsOptions, ListSyncRunsResult } from "../types"

export const listSyncRuns = async (
  db: DbClient,
  customerId: string,
  options: ListSyncRunsOptions,
): Promise<ListSyncRunsResult> => {
  const customerClause = eq(syncRuns.customerId, customerId)
  const whereClause = and(customerClause)
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(syncRuns)
      .where(whereClause)
      .orderBy(desc(syncRuns.startedAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(syncRuns).where(whereClause),
  ])

  const runIds = rows.map((row) => row.id)
  const detailRows =
    runIds.length > 0
      ? await db.select().from(syncRunDetails).where(inArray(syncRunDetails.syncRunId, runIds))
      : []
  const detailsByRunId = new Map<string, typeof detailRows>()

  for (const runId of runIds) {
    detailsByRunId.set(
      runId,
      detailRows.filter((detail) => detail.syncRunId === runId),
    )
  }

  return {
    syncRuns: rows.map((row) => {
      const details = detailsByRunId.get(row.id) ?? []
      return {
        ...row,
        changedCount: details.reduce((sum, detail) => sum + detail.changedCount, 0),
        unchangedCount: details.reduce((sum, detail) => sum + detail.unchangedCount, 0),
        failedCount: details.reduce((sum, detail) => sum + detail.failedCount, 0),
        skippedCount: details.reduce((sum, detail) => sum + detail.skippedCount, 0),
      }
    }),
    totalCount: countRows[0]?.totalCount ?? 0,
  }
}
