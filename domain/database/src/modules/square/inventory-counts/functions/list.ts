import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { catalogItems } from "../../catalog-items/schema"
import { catalogItemVariations } from "../../catalog-item-variations/schema"
import { locations } from "../../locations/schema"
import { inventoryCounts } from "../schema"
import type { ListInventoryCountsOptions, ListInventoryCountsResult } from "../types"

export const listInventoryCounts = async (
  db: DbClient,
  customerId: string,
  options: ListInventoryCountsOptions,
): Promise<ListInventoryCountsResult> => {
  const customerClause = eq(inventoryCounts.customerId, customerId)
  const stateClause = eq(inventoryCounts.state, "IN_STOCK")
  const conditions = [stateClause]

  if (options.locationId) {
    conditions.push(eq(inventoryCounts.locationId, options.locationId))
  }

  if (options.search) {
    const term = `%${options.search}%`
    const searchClause = or(ilike(catalogItems.name, term), ilike(catalogItemVariations.sku, term))
    if (searchClause) {
      conditions.push(searchClause)
    }
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: inventoryCounts.id,
        locationId: inventoryCounts.locationId,
        locationName: locations.name,
        catalogObjectId: inventoryCounts.catalogObjectId,
        catalogItemVariationId: inventoryCounts.catalogItemVariationId,
        itemName: catalogItems.name,
        variationName: catalogItemVariations.name,
        sku: catalogItemVariations.sku,
        state: inventoryCounts.state,
        quantity: inventoryCounts.quantity,
        calculatedAt: inventoryCounts.calculatedAt,
      })
      .from(inventoryCounts)
      .innerJoin(locations, eq(inventoryCounts.locationId, locations.id))
      .leftJoin(
        catalogItemVariations,
        eq(inventoryCounts.catalogItemVariationId, catalogItemVariations.id),
      )
      .leftJoin(catalogItems, eq(catalogItemVariations.itemId, catalogItems.id))
      .where(whereClause)
      .orderBy(desc(inventoryCounts.calculatedAt))
      .limit(options.limit)
      .offset(offset),
    db
      .select({ totalCount: count() })
      .from(inventoryCounts)
      .innerJoin(locations, eq(inventoryCounts.locationId, locations.id))
      .leftJoin(
        catalogItemVariations,
        eq(inventoryCounts.catalogItemVariationId, catalogItemVariations.id),
      )
      .leftJoin(catalogItems, eq(catalogItemVariations.itemId, catalogItems.id))
      .where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: rows,
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
