import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { payments } from "../schema"

export const findPaymentSquareCustomerIdBySquareId = async (
  db: DbClient,
  customerId: string,
  squarePaymentId: string,
): Promise<string | null> => {
  const customerClause = eq(payments.customerId, customerId)
  const conditions = [eq(payments.squareId, squarePaymentId)]
  const whereClause = and(customerClause, ...conditions)

  const [payment] = await db
    .select({ squareCustomerId: payments.squareCustomerId })
    .from(payments)
    .where(whereClause)
    .limit(1)

  return payment?.squareCustomerId ?? null
}
