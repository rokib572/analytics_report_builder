import type { DbClient } from "../../../../db/client"
import { type LocationDto, type LocationPayload, locations } from "../schema"

export const createLocation = async (
  db: DbClient,
  customerId: string,
  data: LocationPayload,
): Promise<LocationDto> => {
  const [location] = await db
    .insert(locations)
    .values({ ...data, customerId })
    .returning()
  return location!
}
