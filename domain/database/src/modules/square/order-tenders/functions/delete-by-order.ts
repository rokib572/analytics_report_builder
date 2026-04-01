import { eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { orderTenders } from "../schema"

export const deleteOrderTendersByOrderId = async (db: DbClient, orderId: string): Promise<void> => {
  await db.delete(orderTenders).where(eq(orderTenders.orderId, orderId))
}
