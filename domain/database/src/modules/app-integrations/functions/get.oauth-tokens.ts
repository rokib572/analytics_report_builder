import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const getOAuthTokens = async (
  db: DbClient,
  query: { customerId: string; appName: string },
) => {
  const { customerId, appName } = query

  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.appName, appName), eq(appIntegrations.isActive, true)]
  const whereClause = and(customerClause, ...conditions)

  const [integration] = await db
    .select({
      id: appIntegrations.id,
      customerId: appIntegrations.customerId,
      oauthAccessToken: appIntegrations.oauthAccessToken,
      oauthRefreshToken: appIntegrations.oauthRefreshToken,
      oauthExpiresAt: appIntegrations.oauthExpiresAt,
      environment: appIntegrations.environment,
      merchantId: appIntegrations.merchantId,
    })
    .from(appIntegrations)
    .where(whereClause)

  return integration ?? null
}
