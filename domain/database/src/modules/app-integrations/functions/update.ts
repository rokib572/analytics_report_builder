import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const updateAppIntegration = async (
  db: DbClient,
  appIntegrationId: string,
  data: { appName: string; appKey: string; environment: string; label?: string },
) => {
  const { appKey, environment, label } = data
  const [updated] = await db
    .update(appIntegrations)
    .set({
      appKey,
      environment,
      label,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(appIntegrations.id, appIntegrationId))
    .returning({
      id: appIntegrations.id,
      customerId: appIntegrations.customerId,
      appName: appIntegrations.appName,
      environment: appIntegrations.environment,
      isActive: appIntegrations.isActive,
      label: appIntegrations.label,
      createdAt: appIntegrations.createdAt,
      updatedAt: appIntegrations.updatedAt,
    })
  return updated ?? null
}
