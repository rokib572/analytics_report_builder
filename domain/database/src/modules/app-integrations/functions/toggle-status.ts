import { eq, and, not } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const toggleAppIntegrationStatus = async (
  db: DbClient,
  query: { customerId: string; appIntegrationId: string },
) => {
  const { customerId, appIntegrationId } = query
  const [integration] = await db
    .update(appIntegrations)
    .set({ isActive: not(appIntegrations.isActive), updatedAt: new Date() })
    .where(
      and(eq(appIntegrations.customerId, customerId), eq(appIntegrations.id, appIntegrationId)),
    )
    .returning({ id: appIntegrations.id, isActive: appIntegrations.isActive })
  return integration ?? null
}
