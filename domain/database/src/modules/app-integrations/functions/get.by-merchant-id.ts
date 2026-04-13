import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const getAppIntegrationByMerchantId = async (db: DbClient, merchantId: string) => {
  const conditions = [
    eq(appIntegrations.merchantId, merchantId),
    eq(appIntegrations.isActive, true),
  ]
  const whereClause = and(...conditions)

  const [integration] = await db
    .select({
      id: appIntegrations.id,
      customerId: appIntegrations.customerId,
      webhookSignatureKey: appIntegrations.webhookSignatureKey,
      environment: appIntegrations.environment,
    })
    .from(appIntegrations)
    .where(whereClause)

  return integration ?? null
}
