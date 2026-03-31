import type { DbClient } from "../../../../db/client"
import { type SyncLogDto, type SyncLogPayload, syncLog } from "../schema"

export const createSyncLog = async (db: DbClient, data: SyncLogPayload): Promise<SyncLogDto> => {
  const [row] = await db.insert(syncLog).values(data).returning()
  return row!
}
