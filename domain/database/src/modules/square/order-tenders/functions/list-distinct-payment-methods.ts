import { asc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"
import { orderTenders } from "../schema"

export const listDistinctPaymentMethods = async (
  db: DbClient,
  customerId: string,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ type: orderTenders.type })
    .from(orderTenders)
    .innerJoin(locations, eq(orderTenders.locationId, locations.id))
    .where(eq(locations.customerId, customerId))
    .orderBy(asc(orderTenders.type))

  return rows.map((row) => row.type).filter((type): type is string => Boolean(type))
}
