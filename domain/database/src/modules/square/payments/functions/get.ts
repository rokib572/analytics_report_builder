import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type PaymentDto, payments } from "../schema"

export const getPayment = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<PaymentDto | undefined> => {
  const customerClause = eq(payments.customerId, customerId)
  const conditions = [eq(payments.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [payment] = await db.select().from(payments).where(whereClause).limit(1)

  return payment as PaymentDto | undefined
}
