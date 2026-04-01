import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type RefundDto, refunds } from "../schema"

export const getRefund = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<RefundDto | undefined> => {
  const customerClause = eq(refunds.customerId, customerId)
  const conditions = [eq(refunds.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [refund] = await db.select().from(refunds).where(whereClause).limit(1)

  return refund as RefundDto | undefined
}
