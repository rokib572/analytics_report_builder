import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { syncRunDetails, syncRuns } from "../schema"
import type { SyncRunWithDetails } from "../types"

export const getSyncRunWithDetails = async (
  db: DbClient,
  customerId: string,
  syncRunId: string,
): Promise<SyncRunWithDetails | null> => {
  const customerClause = eq(syncRuns.customerId, customerId)
  const conditions = [eq(syncRuns.id, syncRunId)]
  const whereClause = and(customerClause, ...conditions)

  const [syncRun, details] = await Promise.all([
    db.select().from(syncRuns).where(whereClause).limit(1),
    db.select().from(syncRunDetails).where(eq(syncRunDetails.syncRunId, syncRunId)),
  ])

  if (!syncRun[0]) return null

  return {
    syncRun: syncRun[0],
    details,
  }
}
