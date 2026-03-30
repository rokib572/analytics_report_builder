import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { DomainError } from "@analytics/shared-libs"

export const validateLocation = async (db: DbClient, customerId: string, locationId: string) => {
  const customerClause = eq(locations.customerId, customerId)
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(customerClause, eq(locations.id, locationId)))

  if (!location) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Location ${locationId} not found for customer ${customerId}`,
      clientSafeMessage: "Location not found.",
      additionalContext: { customerId, locationId },
    })
  }
}
