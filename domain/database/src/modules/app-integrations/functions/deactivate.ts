import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const deactivateIntegration = async (
  db: DbClient,
  customerId: string,
  appIntegrationId: string,
) => {
  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.id, appIntegrationId)]
  const whereClause = and(customerClause, ...conditions)

  const [updated] = await db
    .update(appIntegrations)
    .set({
      isActive: false,
      oauthAccessToken: null,
      oauthRefreshToken: null,
      oauthExpiresAt: null,
      webhookSubscriptionId: null,
      webhookSignatureKey: null,
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning({ id: appIntegrations.id, isActive: appIntegrations.isActive })

  return updated ?? null
}
