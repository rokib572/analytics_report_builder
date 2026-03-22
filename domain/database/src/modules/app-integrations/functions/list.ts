import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations, type AppIntegrationDto } from "../schema"

export const listAppIntegrations = async (
  db: DbClient,
  query: { customerId: string },
): Promise<AppIntegrationDto[]> => {
  const { customerId } = query
  return db.select().from(appIntegrations).where(eq(appIntegrations.customerId, customerId))
}
