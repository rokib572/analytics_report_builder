import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type AppIntegrationDto, appIntegrations } from "../schema"

export const getAppIntegrationById = async (
  db: DbClient,
  query: { customerId: string; appIntegrationId: string },
  opts?: { includeDisabled: boolean },
): Promise<AppIntegrationDto | null> => {
  const { customerId, appIntegrationId } = query
  const { includeDisabled = false } = opts || {}

  const customerClause = eq(appIntegrations.customerId, customerId)
  const conditions = [eq(appIntegrations.id, appIntegrationId)]

  if (!includeDisabled) {
    conditions.push(eq(appIntegrations.isActive, true))
  }

  const whereClause = and(customerClause, ...conditions)

  const [integration] = await db.select().from(appIntegrations).where(whereClause).limit(1)
  return integration ?? null
}
