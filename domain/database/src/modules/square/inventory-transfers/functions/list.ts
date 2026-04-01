import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryTransferDto, inventoryTransfers } from "../schema"
import type { ListInventoryTransfersOptions, ListInventoryTransfersResult } from "../types"

export const listInventoryTransfers = async (
  db: DbClient,
  customerId: string,
  options: ListInventoryTransfersOptions,
): Promise<ListInventoryTransfersResult> => {
  const customerClause = eq(inventoryTransfers.customerId, customerId)
  const conditions = []

  if (options.catalogObjectId) {
    conditions.push(eq(inventoryTransfers.catalogObjectId, options.catalogObjectId))
  }

  if (options.fromLocationId) {
    conditions.push(eq(inventoryTransfers.fromLocationId, options.fromLocationId))
  }

  if (options.toLocationId) {
    conditions.push(eq(inventoryTransfers.toLocationId, options.toLocationId))
  }

  if (options.dateFrom) {
    conditions.push(
      gte(inventoryTransfers.occurredAt, new Date(`${options.dateFrom}T00:00:00.000Z`)),
    )
  }

  if (options.dateTo) {
    conditions.push(lte(inventoryTransfers.occurredAt, new Date(`${options.dateTo}T23:59:59.999Z`)))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(inventoryTransfers)
      .where(whereClause)
      .orderBy(desc(inventoryTransfers.occurredAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(inventoryTransfers).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as InventoryTransferDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
