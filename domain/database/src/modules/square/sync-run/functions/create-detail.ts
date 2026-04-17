import type { DbClient } from "../../../../db/client"
import { type SyncRunDetailDto, type SyncRunDetailPayload, syncRunDetails } from "../schema"

export const createSyncRunDetail = async (
  db: DbClient,
  data: SyncRunDetailPayload,
): Promise<SyncRunDetailDto> => {
  const [row] = await db.insert(syncRunDetails).values(data).returning()
  return row!
}
