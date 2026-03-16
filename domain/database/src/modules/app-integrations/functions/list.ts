import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const listAppIntegrations = async (db: DbClient, query: { customerId: string }) => {
  const { customerId } = query
  return db
    .select({
      id: appIntegrations.id,
      customerId: appIntegrations.customerId,
      appName: appIntegrations.appName,
      environment: appIntegrations.environment,
      isActive: appIntegrations.isActive,
      label: appIntegrations.label,
      createdAt: appIntegrations.createdAt,
      updatedAt: appIntegrations.updatedAt,
      lastUsedAt: appIntegrations.lastUsedAt,
    })
    .from(appIntegrations)
    .where(eq(appIntegrations.customerId, customerId))
}
