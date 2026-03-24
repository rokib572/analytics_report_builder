import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, type LocationPayload, locations } from "../schema"

export const updateLocation = async (
  db: DbClient,
  customerId: string,
  id: string,
  data: Partial<LocationPayload>,
): Promise<LocationDto> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [eq(locations.id, id)]
  const [location] = await db
    .update(locations)
    .set(data)
    .where(and(customerClause, ...conditions))
    .returning()
  return location!
}
