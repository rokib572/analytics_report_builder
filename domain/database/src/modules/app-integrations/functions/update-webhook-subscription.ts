import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const updateWebhookSubscription = async (
  db: DbClient,
  customerId: string,
  appIntegrationId: string,
  data: {
    webhookSubscriptionId: string
    webhookSignatureKey: string
  },
) => {
  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.id, appIntegrationId)]
  const whereClause = and(customerClause, ...conditions)

  const [updated] = await db
    .update(appIntegrations)
    .set({
      webhookSubscriptionId: data.webhookSubscriptionId,
      webhookSignatureKey: data.webhookSignatureKey,
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning({ id: appIntegrations.id })

  return updated ?? null
}
