import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, locations } from "../schema"

export const getLocation = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<LocationDto | undefined> => {
  const customerClause = eq(locations.customerId, customerId)
  const conditions = [eq(locations.id, id)]
  const [location] = await db
    .select()
    .from(locations)
    .where(and(customerClause, ...conditions))
  return location
}
