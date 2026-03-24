import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LocationDto, locations } from "../schema"

export const listLocations = async (db: DbClient, customerId: string): Promise<LocationDto[]> => {
  return db
    .select()
    .from(locations)
    .where(eq(locations.customerId, customerId))
    .orderBy(locations.name)
}
