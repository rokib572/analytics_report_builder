import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryAdjustmentDto, inventoryAdjustments } from "../schema"

export const getInventoryAdjustment = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<InventoryAdjustmentDto | undefined> => {
  const customerClause = eq(inventoryAdjustments.customerId, customerId)
  const conditions = [eq(inventoryAdjustments.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [adjustment] = await db.select().from(inventoryAdjustments).where(whereClause).limit(1)

  return adjustment as InventoryAdjustmentDto | undefined
}
