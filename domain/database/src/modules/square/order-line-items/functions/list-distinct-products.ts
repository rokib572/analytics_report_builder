import { asc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { orderLineItems } from "../schema"

export const listDistinctProducts = async (db: DbClient, customerId: string): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ name: orderLineItems.name })
    .from(orderLineItems)
    .innerJoin(locations, eq(orderLineItems.locationId, locations.id))
    .where(eq(locations.customerId, customerId))
    .orderBy(asc(orderLineItems.name))

  return rows.map((row) => row.name).filter((name): name is string => Boolean(name))
}
