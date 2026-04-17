import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SyncRunDto, syncRuns } from "../schema"
import type { CompleteSyncRunPayload } from "../types"

export const completeSyncRun = async (
  db: DbClient,
  syncRunId: string,
  data: CompleteSyncRunPayload,
): Promise<SyncRunDto | null> => {
  const [row] = await db.update(syncRuns).set(data).where(eq(syncRuns.id, syncRunId)).returning()

  return row ?? null
}
