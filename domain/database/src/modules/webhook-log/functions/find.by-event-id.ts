import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type WebhookLogDto, webhookLog } from "../schema"

export const findWebhookLogByEventId = async (
  db: DbClient,
  eventId: string,
): Promise<WebhookLogDto | undefined> => {
  const [row] = await db.select().from(webhookLog).where(eq(webhookLog.eventId, eventId)).limit(1)
  return row
}
