import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { webhookLog } from "../schema"
import type { UpdateWebhookLogProcessedPayload } from "../types"

export const updateWebhookLogProcessed = async (
  db: DbClient,
  id: string,
  data: UpdateWebhookLogProcessedPayload,
): Promise<void> => {
  await db.update(webhookLog).set(data).where(eq(webhookLog.id, id))
}
