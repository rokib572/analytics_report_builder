import type { DbClient } from "../../../../db/client"
import { type OrderTenderPayload, orderTenders } from "../schema"

export const bulkInsertOrderTenders = async (
  db: DbClient,
  items: OrderTenderPayload[],
): Promise<void> => {
  if (items.length === 0) return
  await db.insert(orderTenders).values(items)
}
