import type { DbClient } from "../../../../db/client"
import { type OrderFulfillmentPayload, orderFulfillments } from "../schema"

export const bulkInsertOrderFulfillments = async (
  db: DbClient,
  items: OrderFulfillmentPayload[],
): Promise<void> => {
  if (items.length === 0) return
  await db.insert(orderFulfillments).values(items)
}
