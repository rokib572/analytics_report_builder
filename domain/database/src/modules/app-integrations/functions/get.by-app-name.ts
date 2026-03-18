import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const getAppIntegrationByAppName = async (
  db: DbClient,
  query: {
    customerId: string
    appName: string
    includeDisabled?: boolean
  },
) => {
  const { customerId, appName, includeDisabled = false } = query

  let conditions = and(
    eq(appIntegrations.customerId, customerId),
    eq(appIntegrations.appName, appName),
  )

  if (!includeDisabled) {
    conditions = and(conditions, eq(appIntegrations.isActive, true))
  }

  const [integration] = await db.select().from(appIntegrations).where(conditions)
  return integration ?? null
}
