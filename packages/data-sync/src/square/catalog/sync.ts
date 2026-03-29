import {
  type DbClient,
  upsertCatalogCategory,
  upsertCatalogItem,
  upsertCatalogItemVariation,
  deleteCatalogItemVariationsByItemId,
} from "@analytics/database"
import { fetchAllCatalogObjects } from "@analytics/square"
import { computeContentHash } from "../../utils/content-hash"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

export const syncCatalog = async (
  db: DbClient,
  customerId: string,
): Promise<{ synced: number; unchanged: number; skipped: number }> => {
  const catalogObjects = await fetchAllCatalogObjects(customerId)

  let synced = 0
  let unchanged = 0
  let skipped = 0

  // Pass 1: Upsert categories
  const categories = catalogObjects.filter((obj) => obj.type === "CATEGORY")
  for (const cat of categories) {
    if (!cat.id) {
      skipped++
      continue
    }

    const categoryData = cat.categoryData
    const hashInput = {
      id: cat.id,
      name: categoryData?.name,
      parentCategory: categoryData?.parentCategory?.id,
      isTopLevel: categoryData?.isTopLevel,
      updatedAt: cat.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogCategory(db, customerId, {
      squareId: cat.id,
      name: categoryData?.name ?? "",
      parentCategoryId: categoryData?.parentCategory?.id ?? null,
      isTopLevel: categoryData?.isTopLevel ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  // Pass 2: Upsert items and their variations
  const items = catalogObjects.filter((obj) => obj.type === "ITEM")
  for (const item of items) {
    if (!item.id) {
      skipped++
      continue
    }

    const itemData = item.itemData
    const categoryId = itemData?.categories?.[0]?.id ?? itemData?.categoryId ?? null
    const hashInput = {
      id: item.id,
      name: itemData?.name,
      description: itemData?.descriptionPlaintext,
      categoryId,
      isArchived: itemData?.isArchived,
      reportingCategoryId: itemData?.reportingCategory?.id,
      variations: itemData?.variations,
      updatedAt: item.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogItem(db, customerId, {
      squareId: item.id,
      name: itemData?.name ?? "",
      description: itemData?.descriptionPlaintext ?? null,
      categoryId,
      isArchived: itemData?.isArchived ?? null,
      reportingCategoryId: itemData?.reportingCategory?.id ?? null,
      contentHash,
    })

    if (result) {
      // Delete existing variations and re-insert (same pattern as order line items)
      await deleteCatalogItemVariationsByItemId(db, result.id)

      const variations = itemData?.variations ?? []
      for (const variation of variations) {
        if (!variation.id || variation.type !== "ITEM_VARIATION") continue

        const varData = variation.itemVariationData
        const varHashInput = {
          id: variation.id,
          name: varData?.name,
          sku: varData?.sku,
          priceMoney: varData?.priceMoney?.amount?.toString(),
          priceCurrency: varData?.priceMoney?.currency,
          ordinal: varData?.ordinal,
          updatedAt: variation.updatedAt,
        }
        const varContentHash = computeContentHash(varHashInput as Record<string, unknown>)

        await upsertCatalogItemVariation(db, customerId, {
          squareId: variation.id,
          itemId: result.id,
          name: varData?.name ?? null,
          sku: varData?.sku ?? null,
          priceMoney: toBigInt(varData?.priceMoney),
          priceCurrency: varData?.priceMoney?.currency ?? null,
          ordinal: varData?.ordinal ?? null,
          contentHash: varContentHash,
        })
      }

      synced++
    } else {
      unchanged++
    }
  }

  return { synced, unchanged, skipped }
}
