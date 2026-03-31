import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../schema"

export const findLocationBySquareId = async (
  db: DbClient,
  squareId: string,
): Promise<{ id: string; customerId: string } | undefined> => {
  const [location] = await db
    .select({ id: locations.id, customerId: locations.customerId })
    .from(locations)
    .where(eq(locations.squareId, squareId))
    .limit(1)

  return location
}
