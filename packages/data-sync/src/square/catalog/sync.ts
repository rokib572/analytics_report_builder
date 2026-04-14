import {
  type DbClient,
  upsertCatalogCategory,
  upsertCatalogDiscount,
  upsertCatalogItem,
  upsertCatalogItemVariation,
  upsertCatalogModifier,
  upsertCatalogModifierList,
  upsertCatalogTax,
  deleteCatalogItemVariationsByItemId,
  findCatalogModifierListIdBySquareId,
} from "@analytics/database"
import type { Square } from "square"
import { fetchAllCatalogObjects } from "@analytics/square"
import { computeContentHash } from "../../utils/content-hash"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

const isCatalogDiscount = (obj: Square.CatalogObject): obj is Square.CatalogObject.Discount =>
  obj.type === "DISCOUNT"

const isCatalogTax = (obj: Square.CatalogObject): obj is Square.CatalogObject.Tax =>
  obj.type === "TAX"

const isCatalogModifierList = (
  obj: Square.CatalogObject,
): obj is Square.CatalogObject.ModifierList => obj.type === "MODIFIER_LIST"

const isCatalogModifier = (obj: Square.CatalogObject): obj is Square.CatalogObject.Modifier =>
  obj.type === "MODIFIER"

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

  // Pass 2: Upsert discounts
  const discounts = catalogObjects.filter(isCatalogDiscount)
  for (const discount of discounts) {
    if (!discount.id) {
      skipped++
      continue
    }

    const discountData = discount.discountData
    const hashInput = {
      id: discount.id,
      name: discountData?.name,
      discountType: discountData?.discountType,
      percentage: discountData?.percentage,
      amountMoney: discountData?.amountMoney?.amount?.toString(),
      amountCurrency: discountData?.amountMoney?.currency,
      pinRequired: discountData?.pinRequired,
      updatedAt: discount.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogDiscount(db, customerId, {
      squareId: discount.id,
      name: discountData?.name ?? "",
      discountType: discountData?.discountType ?? null,
      percentage: discountData?.percentage ?? null,
      amountMoney: toBigInt(discountData?.amountMoney),
      pinRequired: discountData?.pinRequired ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  // Pass 3: Upsert taxes
  const taxes = catalogObjects.filter(isCatalogTax)
  for (const tax of taxes) {
    if (!tax.id) {
      skipped++
      continue
    }

    const taxData = tax.taxData
    const hashInput = {
      id: tax.id,
      name: taxData?.name,
      percentage: taxData?.percentage,
      inclusionType: taxData?.inclusionType,
      appliesToCustomAmounts: taxData?.appliesToCustomAmounts,
      enabled: taxData?.enabled,
      updatedAt: tax.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogTax(db, customerId, {
      squareId: tax.id,
      name: taxData?.name ?? "",
      percentage: taxData?.percentage ?? null,
      inclusionType: taxData?.inclusionType ?? null,
      appliesToCustomAmounts: taxData?.appliesToCustomAmounts ?? null,
      enabled: taxData?.enabled ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  // Pass 4: Upsert modifier lists
  const modifierLists = catalogObjects.filter(isCatalogModifierList)
  for (const modifierList of modifierLists) {
    if (!modifierList.id) {
      skipped++
      continue
    }

    const modifierListData = modifierList.modifierListData
    const hashInput = {
      id: modifierList.id,
      name: modifierListData?.name,
      selectionType: modifierListData?.selectionType,
      ordinal: modifierListData?.ordinal,
      updatedAt: modifierList.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogModifierList(db, customerId, {
      squareId: modifierList.id,
      name: modifierListData?.name ?? "",
      selectionType: modifierListData?.selectionType ?? null,
      ordinal: modifierListData?.ordinal ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  // Pass 5: Upsert modifiers
  const modifiers = catalogObjects.filter(isCatalogModifier)
  for (const modifier of modifiers) {
    if (!modifier.id) {
      skipped++
      continue
    }

    const modifierData = modifier.modifierData
    const modifierListSquareId = modifierData?.modifierListId
    if (!modifierListSquareId) {
      skipped++
      continue
    }

    const modifierListId = await findCatalogModifierListIdBySquareId(
      db,
      customerId,
      modifierListSquareId,
    )
    if (!modifierListId) {
      skipped++
      continue
    }

    const hashInput = {
      id: modifier.id,
      modifierListId,
      modifierListSquareId,
      name: modifierData?.name,
      priceMoney: modifierData?.priceMoney?.amount?.toString(),
      priceCurrency: modifierData?.priceMoney?.currency,
      ordinal: modifierData?.ordinal,
      updatedAt: modifier.updatedAt,
    }
    const contentHash = computeContentHash(hashInput as Record<string, unknown>)

    const result = await upsertCatalogModifier(db, customerId, {
      squareId: modifier.id,
      modifierListId,
      name: modifierData?.name ?? "",
      priceMoney: toBigInt(modifierData?.priceMoney),
      priceCurrency: modifierData?.priceMoney?.currency ?? null,
      ordinal: modifierData?.ordinal ?? null,
      contentHash,
    })

    if (result) {
      synced++
    } else {
      unchanged++
    }
  }

  // Pass 6: Upsert items and their variations
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
