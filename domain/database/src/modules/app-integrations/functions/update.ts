import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type AppIntegrationDto, type AppIntegrationPayload, appIntegrations } from "../schema"

export const updateAppIntegration = async (
  db: DbClient,
  appIntegrationId: string,
  data: AppIntegrationPayload,
): Promise<AppIntegrationDto | null> => {
  const [updated] = await db
    .update(appIntegrations)
    .set({
      ...data,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(appIntegrations.id, appIntegrationId))
    .returning()

  return updated
}
