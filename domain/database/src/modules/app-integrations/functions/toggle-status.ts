import { eq, and, not } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"
import { getAppIntegrationById } from "./get.by-id"
import { DomainError } from "@analytics/shared-libs"

export const toggleAppIntegrationStatus = async (
  db: DbClient,
  query: { customerId: string; appIntegrationId: string },
): Promise<{ id: string; isActive: boolean } | null> => {
  const { customerId, appIntegrationId } = query

  const existingIntegration = await getAppIntegrationById(db, { customerId, appIntegrationId })

  if (!existingIntegration) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `App integration with ID ${appIntegrationId} not found for customer ${customerId}`,
      clientSafeMessage: "App integration not found.",
      additionalContext: { customerId, appIntegrationId },
    })
  }

  const [integration] = await db
    .update(appIntegrations)
    .set({ isActive: not(appIntegrations.isActive), updatedAt: new Date() })
    .where(
      and(eq(appIntegrations.customerId, customerId), eq(appIntegrations.id, appIntegrationId)),
    )
    .returning()

  return integration!
}
