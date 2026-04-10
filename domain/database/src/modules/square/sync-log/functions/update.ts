import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SyncLogDto, syncLog } from "../schema"
import type { UpdateSyncLogPayload } from "../types"

export const updateSyncLog = async (
  db: DbClient,
  id: string,
  data: UpdateSyncLogPayload,
): Promise<SyncLogDto | null> => {
  const [row] = await db
    .update(syncLog)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(syncLog.id, id))
    .returning()

  return row ?? null
}
