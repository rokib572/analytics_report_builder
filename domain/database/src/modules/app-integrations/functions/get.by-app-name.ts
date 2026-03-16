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

  const [integration] = await db
    .select()
    .from(appIntegrations)
    .where(
      and(
        eq(appIntegrations.customerId, customerId),
        eq(appIntegrations.appName, appName),
        eq(appIntegrations.isActive, !includeDisabled),
      ),
    )
  return integration ?? null
}
