import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../schema"

export const getLocationSquareIdMap = async (
  db: DbClient,
  customerId: string,
): Promise<Map<string, string>> => {
  const rows = await db
    .select({ squareId: locations.squareId, id: locations.id })
    .from(locations)
    .where(eq(locations.customerId, customerId))

  return new Map(rows.map((r) => [r.squareId, r.id]))
}
