import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { orderFulfillments } from "../schema"

export const deleteOrderFulfillmentsByOrderId = async (
  db: DbClient,
  orderId: string,
): Promise<void> => {
  await db.delete(orderFulfillments).where(eq(orderFulfillments.orderId, orderId))
}
