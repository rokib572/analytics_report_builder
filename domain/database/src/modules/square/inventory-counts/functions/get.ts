import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryCountDto, inventoryCounts } from "../schema"

export const getInventoryCount = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<InventoryCountDto | undefined> => {
  const customerClause = eq(inventoryCounts.customerId, customerId)
  const conditions = [eq(inventoryCounts.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [count] = await db.select().from(inventoryCounts).where(whereClause).limit(1)

  return count as InventoryCountDto | undefined
}
