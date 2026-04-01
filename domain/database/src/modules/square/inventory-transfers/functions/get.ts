import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryTransferDto, inventoryTransfers } from "../schema"

export const getInventoryTransfer = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<InventoryTransferDto | undefined> => {
  const customerClause = eq(inventoryTransfers.customerId, customerId)
  const conditions = [eq(inventoryTransfers.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [transfer] = await db.select().from(inventoryTransfers).where(whereClause).limit(1)

  return transfer as InventoryTransferDto | undefined
}
