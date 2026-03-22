import type { DbClient } from "../../../db/client"
import { getAppIntegrationByAppName } from "./get.by-app-name"
import { DomainError } from "@analytics/shared-libs"

export const validateAppIntegration = async (db: DbClient, customerId: string, appName: string) => {
  const existing = await getAppIntegrationByAppName(
    db,
    {
      customerId,
      appName,
    },
    { includeDisabled: true },
  )

  if (existing) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `An app integration with the name "${appName}" already exists for customer ${customerId}`,
      clientSafeMessage: `An app integration with the name "${appName}" already exists. Please choose a different name.`,
      additionalContext: { customerId, appName },
    })
  }
}
