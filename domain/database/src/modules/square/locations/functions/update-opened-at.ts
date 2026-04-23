import { and, eq } from "drizzle-orm"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, locations } from "../schema"

export const updateLocationOpenedAt = async (
  db: DbClient,
  customerId: string,
  id: string,
  openedAt: string | null,
): Promise<LocationDto> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [eq(locations.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [location] = await db.update(locations).set({ openedAt }).where(whereClause).returning()

  if (!location) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Location ${id} not found for customer ${customerId}`,
      clientSafeMessage: "Location not found.",
      additionalContext: { customerId, id },
    })
  }

  return location as LocationDto
}
