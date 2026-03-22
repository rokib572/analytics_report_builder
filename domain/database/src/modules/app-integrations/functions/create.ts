import type { DbClient } from "../../../db/client"
import { type AppIntegrationPayload, type AppIntegrationDto, appIntegrations } from "../schema"
import { validateAppIntegration } from "./create.validate-app-integration"

export const createAppIntegration = async (
  db: DbClient,
  customerId: string,
  data: AppIntegrationPayload,
): Promise<AppIntegrationDto> => {
  const { appName } = data
  await validateAppIntegration(db, customerId, appName)
  const [integration] = await db
    .insert(appIntegrations)
    .values({ customerId, ...data })
    .returning()

  return integration!
}
