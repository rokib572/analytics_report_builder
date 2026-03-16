import { eq, and } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

export const getAppIntegrationById = async (
  db: DbClient,
  query: { customerId: string; id: string },
) => {
  const { customerId, id } = query
  const [integration] = await db
    .select()
    .from(appIntegrations)
    .where(and(eq(appIntegrations.customerId, customerId), eq(appIntegrations.id, id)))
  return integration ?? null
}
