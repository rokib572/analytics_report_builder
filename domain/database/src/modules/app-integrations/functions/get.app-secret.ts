import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const getAppIntegrationSecret = async (
  db: DbClient,
  query: {
    customerId: string
    appName: string
  },
  opts?: { includeDisabled: boolean },
): Promise<{
  id: string
  customerId: string
  appSecret: string
  appName: string
  environment: string
} | null> => {
  const { customerId, appName } = query
  const { includeDisabled = false } = opts || {}

  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.appName, appName)]

  if (!includeDisabled) {
    conditions.push(eq(appIntegrations.isActive, true))
  }

  const whereClause = and(customerClause, ...conditions)

  const [integration] = await db.select().from(appIntegrations).where(whereClause)
  return integration || null
}
