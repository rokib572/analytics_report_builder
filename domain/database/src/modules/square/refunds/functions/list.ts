import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type RefundDto, refunds } from "../schema"
import type { ListRefundsOptions, ListRefundsResult } from "../types"

export const listRefunds = async (
  db: DbClient,
  customerId: string,
  options: ListRefundsOptions,
): Promise<ListRefundsResult> => {
  const customerClause = eq(refunds.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(refunds.locationId, options.locationId))
  }

  if (options.dateFrom) {
    conditions.push(gte(refunds.createdAt, new Date(`${options.dateFrom}T00:00:00.000Z`)))
  }

  if (options.dateTo) {
    conditions.push(lte(refunds.createdAt, new Date(`${options.dateTo}T23:59:59.999Z`)))
  }

  if (options.status) {
    conditions.push(eq(refunds.status, options.status))
  }

  if (options.paymentId) {
    conditions.push(eq(refunds.paymentId, options.paymentId))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(refunds)
      .where(whereClause)
      .orderBy(desc(refunds.createdAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(refunds).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as RefundDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
