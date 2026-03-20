import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"
import { getAppIntegrationByAppName } from "./get.by-app-name"
import type { CreateAppIntegrationInput } from "./types"
import { updateAppIntegration } from "./update"

export const createAppIntegration = async (
  db: DbClient,
  customerId: string,
  data: CreateAppIntegrationInput,
) => {
  const { appName, appKey, appSecret, environment, label } = data

  const existing = await getAppIntegrationByAppName(db, {
    customerId,
    appName,
    includeDisabled: true,
  })

  if (existing) {
    const updated = await updateAppIntegration(db, existing.id, {
      appName,
      appKey,
      appSecret,
      environment,
      label,
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
