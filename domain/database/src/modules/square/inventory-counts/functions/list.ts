import { and, count, desc, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type InventoryCountDto, inventoryCounts } from "../schema"
import type { ListInventoryCountsOptions, ListInventoryCountsResult } from "../types"

export const listInventoryCounts = async (
  db: DbClient,
  customerId: string,
  options: ListInventoryCountsOptions,
): Promise<ListInventoryCountsResult> => {
  const customerClause = eq(inventoryCounts.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(inventoryCounts.locationId, options.locationId))
  }

  if (options.catalogObjectId) {
    conditions.push(eq(inventoryCounts.catalogObjectId, options.catalogObjectId))
  }

  if (options.state) {
    conditions.push(eq(inventoryCounts.state, options.state))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(inventoryCounts)
      .where(whereClause)
      .orderBy(desc(inventoryCounts.calculatedAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(inventoryCounts).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as InventoryCountDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
