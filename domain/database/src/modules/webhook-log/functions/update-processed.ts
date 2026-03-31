import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { webhookLog } from "../schema"

export const updateWebhookLogProcessed = async (db: DbClient, id: string): Promise<void> => {
  await db.update(webhookLog).set({ processed: true }).where(eq(webhookLog.id, id))
}
