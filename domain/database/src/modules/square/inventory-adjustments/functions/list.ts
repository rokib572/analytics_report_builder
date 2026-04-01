import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryAdjustmentDto, inventoryAdjustments } from "../schema"
import type { ListInventoryAdjustmentsOptions, ListInventoryAdjustmentsResult } from "../types"

export const listInventoryAdjustments = async (
  db: DbClient,
  customerId: string,
  options: ListInventoryAdjustmentsOptions,
): Promise<ListInventoryAdjustmentsResult> => {
  const customerClause = eq(inventoryAdjustments.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(inventoryAdjustments.locationId, options.locationId))
  }

  if (options.catalogObjectId) {
    conditions.push(eq(inventoryAdjustments.catalogObjectId, options.catalogObjectId))
  }

  if (options.dateFrom) {
    conditions.push(
      gte(inventoryAdjustments.occurredAt, new Date(`${options.dateFrom}T00:00:00.000Z`)),
    )
  }

  if (options.dateTo) {
    conditions.push(
      lte(inventoryAdjustments.occurredAt, new Date(`${options.dateTo}T23:59:59.999Z`)),
    )
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(inventoryAdjustments)
      .where(whereClause)
      .orderBy(desc(inventoryAdjustments.occurredAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(inventoryAdjustments).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as InventoryAdjustmentDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
