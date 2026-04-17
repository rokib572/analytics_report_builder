import type { DbClient } from "../../../../db/client"
import { type SyncRunDto, type SyncRunPayload, syncRuns } from "../schema"

export const createSyncRun = async (db: DbClient, data: SyncRunPayload): Promise<SyncRunDto> => {
  const [row] = await db.insert(syncRuns).values(data).returning()
  return row!
}
