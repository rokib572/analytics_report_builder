import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type PaymentDto, payments } from "../schema"
import type { ListPaymentsOptions, ListPaymentsResult } from "../types"

export const listPayments = async (
  db: DbClient,
  customerId: string,
  options: ListPaymentsOptions,
): Promise<ListPaymentsResult> => {
  const customerClause = eq(payments.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(payments.locationId, options.locationId))
  }

  if (options.dateFrom) {
    conditions.push(gte(payments.createdAt, new Date(`${options.dateFrom}T00:00:00.000Z`)))
  }

  if (options.dateTo) {
    conditions.push(lte(payments.createdAt, new Date(`${options.dateTo}T23:59:59.999Z`)))
  }

  if (options.sourceType) {
    conditions.push(eq(payments.sourceType, options.sourceType))
  }

  if (options.status) {
    conditions.push(eq(payments.status, options.status))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(payments)
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(payments).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as PaymentDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
