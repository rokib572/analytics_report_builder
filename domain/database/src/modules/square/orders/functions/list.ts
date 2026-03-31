import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type OrderDto, orders } from "../schema"
import type { ListOrdersOptions, ListOrdersResult } from "../types"

export const listOrders = async (
  db: DbClient,
  customerId: string,
  options: ListOrdersOptions,
): Promise<ListOrdersResult> => {
  const customerClause = eq(orders.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(orders.locationId, options.locationId))
  }

  if (options.dateFrom) {
    conditions.push(gte(orders.saleDate, options.dateFrom))
  }

  if (options.dateTo) {
    conditions.push(lte(orders.saleDate, options.dateTo))
  }

  if (options.state) {
    conditions.push(eq(orders.state, options.state))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [orderRows, countRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.saleDate), desc(orders.createdAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(orders).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    orders: orderRows as OrderDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
