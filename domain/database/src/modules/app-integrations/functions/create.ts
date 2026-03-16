import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"
import { getAppIntegrationByAppName } from "./get.by-app-name"
import { updateAppIntegration } from "./update"

export const createAppIntegration = async (
  db: DbClient,
  customerId: string,
  data: {
    appName: string
    appKey: string
    environment: string
    label?: string
  },
) => {
  const existing = await getAppIntegrationByAppName(db, {
    customerId,
    appName: data.appName,
    includeDisabled: true,
  })

  if (existing) {
    const updated = await updateAppIntegration(db, existing.id, {
      appName: data.appName,
      appKey: data.appKey,
      environment: data.environment,
      label: data.label,
    })
    return updated ?? null
  }

  const [integration] = await db
    .insert(appIntegrations)
    .values({ customerId, ...data })
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
  return integration ?? null
}
