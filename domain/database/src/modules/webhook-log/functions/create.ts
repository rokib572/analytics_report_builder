import type { DbClient } from "../../../db/client"
import { type WebhookLogDto, type WebhookLogPayload, webhookLog } from "../schema"

export const createWebhookLog = async (
  db: DbClient,
  data: WebhookLogPayload,
): Promise<WebhookLogDto> => {
  const [row] = await db.insert(webhookLog).values(data).returning()
  return row!
}
