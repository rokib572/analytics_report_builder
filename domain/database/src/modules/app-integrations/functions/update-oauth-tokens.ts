import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const updateOAuthTokens = async (
  db: DbClient,
  customerId: string,
  appIntegrationId: string,
  data: {
    oauthAccessToken: string
    oauthRefreshToken: string
    oauthExpiresAt: Date
    merchantId?: string
    scopes?: string
    reactivate?: boolean
  },
) => {
  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.id, appIntegrationId)]
  const whereClause = and(customerClause, ...conditions)

  const [updated] = await db
    .update(appIntegrations)
    .set({
      oauthAccessToken: data.oauthAccessToken,
      oauthRefreshToken: data.oauthRefreshToken,
      oauthExpiresAt: data.oauthExpiresAt,
      ...(data.merchantId ? { merchantId: data.merchantId } : {}),
      ...(data.scopes ? { scopes: data.scopes } : {}),
      ...(data.reactivate ? { isActive: true } : {}),
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning({ id: appIntegrations.id })

  return updated ?? null
}
