import { and, asc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type OrderDto, orders } from "../schema"
import { type OrderLineItemDto, orderLineItems } from "../../order-line-items/schema"

export const getOrder = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<{ order: OrderDto; lineItems: OrderLineItemDto[] } | undefined> => {
  const customerClause = eq(orders.customerId, customerId)
  const conditions = [eq(orders.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [orderRows, lineItems] = await Promise.all([
    db.select().from(orders).where(whereClause).limit(1),
    db
      .select()
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, id))
      .orderBy(asc(orderLineItems.name)),
  ])

  const [order] = orderRows

  if (!order) {
    return undefined
  }

  return {
    order: order as OrderDto,
    lineItems: lineItems as OrderLineItemDto[],
  }
}
