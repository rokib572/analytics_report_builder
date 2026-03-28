import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { orderLineItems } from "../schema"

export const deleteOrderLineItemsByOrderId = async (
  db: DbClient,
  orderId: string,
): Promise<void> => {
  await db.delete(orderLineItems).where(eq(orderLineItems.orderId, orderId))
}
