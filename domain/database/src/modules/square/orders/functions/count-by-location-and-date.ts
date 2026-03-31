import { and, count, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { orders } from "../schema"

export const countOrdersByLocationAndDate = async (
  db: DbClient,
  locationId: string,
  saleDate: string,
): Promise<number> => {
  const [row] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.locationId, locationId), eq(orders.saleDate, saleDate)))

  return row?.count ?? 0
}
