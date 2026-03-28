import type { DbClient } from "../../../../db/client"
import { type OrderLineItemPayload, orderLineItems } from "../schema"

export const bulkInsertOrderLineItems = async (
  db: DbClient,
  items: OrderLineItemPayload[],
): Promise<void> => {
  if (items.length === 0) return
  await db.insert(orderLineItems).values(items)
}
