import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { type Square, SquareClient, SquareEnvironment } from "square"
import {
  CATALOG_ITEMS,
  CATEGORIES,
  CUSTOMERS,
  DISCOUNTS,
  INVENTORY_CONFIG,
  MODIFIER_LISTS,
  ORDER_CONFIG,
  SEED_OUTPUT_FILE,
  TAXES,
  type SeedOutput,
} from "./config"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getSquareEnvironment = () => {
  const env = process.env.SQUARE_ENVIRONMENT ?? "sandbox"
  return env === "production" ? "production" : "sandbox"
}

// ---------------------------------------------------------------------------
// Step 1: List locations
// ---------------------------------------------------------------------------

const listLocations = async (client: SquareClient) => {
  const response = await client.locations.list()
  const locations = (response.locations ?? []).filter((l) => l.id && l.status !== "INACTIVE")
  if (locations.length === 0)
    throw new Error("No active locations found in the configured Square account")
  return locations
}

// ---------------------------------------------------------------------------
// Step 2: Create catalog objects (categories, discounts, taxes, modifier lists, items)
// ---------------------------------------------------------------------------

type VariationMapping = {
  variationId: string
  itemName: string
  itemCategory: string
  variationName: string
  price: number
  modifierListIds: string[]
}

type CatalogMappings = {
  variations: VariationMapping[]
  discountIds: Record<string, string>
  taxIds: Record<string, string>
  modifierListIds: Record<string, string>
}

const tempCategoryId = (i: number) => `#cat-${i}`
const tempDiscountId = (i: number) => `#disc-${i}`
const tempTaxId = (i: number) => `#tax-${i}`
const tempModifierListId = (i: number) => `#ml-${i}`
const tempModifierId = (i: number, j: number) => `#mod-${i}-${j}`
const tempItemId = (i: number) => `#item-${i}`
const tempVariationId = (i: number, j: number) => `#item-${i}-var-${j}`

const createCatalogObjects = async (client: SquareClient): Promise<CatalogMappings> => {
  const objects: Square.CatalogObject[] = []

  CATEGORIES.forEach((name, i) => {
    objects.push({
      type: "CATEGORY",
      id: tempCategoryId(i),
      categoryData: { name },
    })
  })

  DISCOUNTS.forEach((discount, i) => {
    objects.push({
      type: "DISCOUNT",
      id: tempDiscountId(i),
      discountData:
        discount.type === "FIXED_PERCENTAGE"
          ? {
              name: discount.name,
              discountType: "FIXED_PERCENTAGE",
              percentage: discount.percentage,
              pinRequired: false,
            }
          : {
              name: discount.name,
              discountType: "FIXED_AMOUNT",
              amountMoney: { amount: BigInt(discount.amount), currency: "USD" },
              pinRequired: false,
            },
    })
  })

  TAXES.forEach((tax, i) => {
    objects.push({
      type: "TAX",
      id: tempTaxId(i),
      taxData: {
        name: tax.name,
        calculationPhase: "TAX_SUBTOTAL_PHASE",
        inclusionType: "ADDITIVE",
        percentage: tax.percentage,
        enabled: true,
      },
    })
  })

  MODIFIER_LISTS.forEach((list, i) => {
    objects.push({
      type: "MODIFIER_LIST",
      id: tempModifierListId(i),
      modifierListData: {
        name: list.name,
        selectionType: list.selectionType,
        modifiers: list.modifiers.map((mod, j) => ({
          type: "MODIFIER",
          id: tempModifierId(i, j),
          modifierData: {
            name: mod.name,
            priceMoney: { amount: BigInt(mod.price), currency: "USD" },
          },
        })),
      },
    })
  })

  CATALOG_ITEMS.forEach((item, i) => {
    const categoryIdx = CATEGORIES.indexOf(item.category)
    const modifierListInfo = (item.modifierListKeys ?? []).map((key) => {
      const idx = MODIFIER_LISTS.findIndex((ml) => ml.key === key)
      return { modifierListId: tempModifierListId(idx) }
    })

    objects.push({
      type: "ITEM",
      id: tempItemId(i),
      itemData: {
        name: item.name,
        categories: categoryIdx >= 0 ? [{ id: tempCategoryId(categoryIdx) }] : undefined,
        modifierListInfo: modifierListInfo.length > 0 ? modifierListInfo : undefined,
        variations: item.variations.map((v, j) => ({
          type: "ITEM_VARIATION",
          id: tempVariationId(i, j),
          itemVariationData: {
            name: v.name,
            pricingType: "FIXED_PRICING",
            priceMoney: { amount: BigInt(v.price), currency: "USD" },
          },
        })),
      },
    })
  })

  const response = await client.catalog.batchUpsert({
    idempotencyKey: crypto.randomUUID(),
    batches: [{ objects }],
  })

  const mappings = response.idMappings ?? []
  const resolveId = (tempId: string): string | null => {
    const mapping = mappings.find((m: Square.CatalogIdMapping) => m.clientObjectId === tempId)
    return mapping?.objectId ?? null
  }

  const result: CatalogMappings = {
    variations: [],
    discountIds: {},
    taxIds: {},
    modifierListIds: {},
  }

  DISCOUNTS.forEach((discount, i) => {
    const id = resolveId(tempDiscountId(i))
    if (id) result.discountIds[discount.key] = id
  })

  TAXES.forEach((tax, i) => {
    const id = resolveId(tempTaxId(i))
    if (id) result.taxIds[tax.key] = id
  })

  MODIFIER_LISTS.forEach((list, i) => {
    const id = resolveId(tempModifierListId(i))
    if (id) result.modifierListIds[list.key] = id
  })

  CATALOG_ITEMS.forEach((item, i) => {
    item.variations.forEach((variation, j) => {
      const variationId = resolveId(tempVariationId(i, j))
      if (!variationId) return
      const modifierListIds = (item.modifierListKeys ?? [])
        .map((key) => result.modifierListIds[key])
        .filter((id): id is string => Boolean(id))
      result.variations.push({
        variationId,
        itemName: item.name,
        itemCategory: item.category,
        variationName: variation.name,
        price: variation.price,
        modifierListIds,
      })
    })
  })

  return result
}

// ---------------------------------------------------------------------------
// Step 3: Fetch modifiers per modifier-list (needed when applying to line items)
// ---------------------------------------------------------------------------

const fetchModifierIdsByList = async (
  client: SquareClient,
  modifierListIds: Record<string, string>,
): Promise<Record<string, string[]>> => {
  const result: Record<string, string[]> = {}
  const allIds = Object.values(modifierListIds)
  if (allIds.length === 0) return result

  const response = await client.catalog.batchGet({ objectIds: allIds, includeRelatedObjects: true })
  const related = response.relatedObjects ?? []
  for (const [key, listId] of Object.entries(modifierListIds)) {
    const modifiers = related
      .filter((obj) => obj.type === "MODIFIER" && obj.modifierData?.modifierListId === listId)
      .map((obj) => obj.id)
      .filter((id): id is string => Boolean(id))
    result[key] = modifiers
  }
  return result
}

// ---------------------------------------------------------------------------
// Step 4: Seed inventory counts at every location
// ---------------------------------------------------------------------------

const seedInventory = async (
  client: SquareClient,
  locationIds: string[],
  variations: VariationMapping[],
): Promise<number> => {
  const occurredAt = new Date().toISOString()
  const changes: Square.InventoryChange[] = []
  for (const locationId of locationIds) {
    for (const variation of variations) {
      changes.push({
        type: "PHYSICAL_COUNT",
        physicalCount: {
          catalogObjectId: variation.variationId,
          state: INVENTORY_CONFIG.state,
          locationId,
          quantity: String(
            randomInt(INVENTORY_CONFIG.initialStock.min, INVENTORY_CONFIG.initialStock.max),
          ),
          occurredAt,
        },
      })
    }
  }

  let applied = 0
  for (let i = 0; i < changes.length; i += INVENTORY_CONFIG.batchSize) {
    const batch = changes.slice(i, i + INVENTORY_CONFIG.batchSize)
    await client.inventory.batchCreateChanges({
      idempotencyKey: crypto.randomUUID(),
      changes: batch,
      ignoreUnchangedCounts: true,
    })
    applied += batch.length
    await delay(200)
  }

  return applied
}

// ---------------------------------------------------------------------------
// Step 5: Create customers
// ---------------------------------------------------------------------------

type CreatedCustomer = { id: string; name: string }

const createCustomers = async (client: SquareClient): Promise<CreatedCustomer[]> => {
  const created: CreatedCustomer[] = []

  for (const customer of CUSTOMERS) {
    const response = await client.customers.create({
      idempotencyKey: crypto.randomUUID(),
      givenName: customer.givenName,
      familyName: customer.familyName,
      emailAddress: customer.email,
    })

    if (response.customer?.id) {
      created.push({
        id: response.customer.id,
        name: `${customer.givenName} ${customer.familyName}`,
      })
    }

    await delay(100)
  }

  return created
}

// ---------------------------------------------------------------------------
// Step 6: Create orders with taxes, discounts, modifiers, payments
// ---------------------------------------------------------------------------

const getDateRange = (from: string, to: string): string[] => {
  const dates: string[] = []
  const current = new Date(from)
  const end = new Date(to)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const createOrders = async (
  client: SquareClient,
  locations: Square.Location[],
  catalog: CatalogMappings,
  modifiersByListKey: Record<string, string[]>,
  customers: CreatedCustomer[],
): Promise<string[]> => {
  const days = getDateRange(ORDER_CONFIG.dateRangeFrom, ORDER_CONFIG.dateRangeTo)
  const discountKeys = Object.keys(catalog.discountIds)
  const taxKeys = Object.keys(catalog.taxIds)
  const squareOrderIds: string[] = []

  for (const day of days) {
    const orderCount = randomInt(ORDER_CONFIG.ordersPerDay.min, ORDER_CONFIG.ordersPerDay.max)
    let createdForDay = 0

    for (let i = 0; i < orderCount; i++) {
      const location = pickRandom(locations)
      if (!location.id) continue

      const lineItemCount = randomInt(
        ORDER_CONFIG.lineItemsPerOrder.min,
        ORDER_CONFIG.lineItemsPerOrder.max,
      )

      const lineItems: Square.OrderLineItem[] = Array.from({ length: lineItemCount }, () => {
        const variation = pickRandom(catalog.variations)
        const quantity = randomInt(1, 3)
        const modifiers: Square.OrderLineItemModifier[] = []
        if (Math.random() < ORDER_CONFIG.modifierProbability && variation.modifierListIds.length) {
          const modifierListKey = Object.entries(catalog.modifierListIds).find(
            ([, id]) => id === variation.modifierListIds[0],
          )?.[0]
          const modifierIds = modifierListKey ? (modifiersByListKey[modifierListKey] ?? []) : []
          if (modifierIds.length) modifiers.push({ catalogObjectId: pickRandom(modifierIds) })
        }
        return {
          catalogObjectId: variation.variationId,
          quantity: String(quantity),
          modifiers: modifiers.length ? modifiers : undefined,
        }
      })

      const taxes: Square.OrderLineItemTax[] = []
      if (Math.random() < ORDER_CONFIG.taxProbability && taxKeys.length) {
        const taxKey = pickRandom(taxKeys)
        const taxId = catalog.taxIds[taxKey]
        if (taxId) taxes.push({ catalogObjectId: taxId, scope: "ORDER" })
      }

      const discounts: Square.OrderLineItemDiscount[] = []
      if (Math.random() < ORDER_CONFIG.discountProbability && discountKeys.length) {
        const discountKey = pickRandom(discountKeys)
        const discountId = catalog.discountIds[discountKey]
        if (discountId) discounts.push({ catalogObjectId: discountId, scope: "ORDER" })
      }

      const customer =
        Math.random() < ORDER_CONFIG.customerProbability ? pickRandom(customers) : undefined

      const orderResponse = await client.orders.create({
        order: {
          locationId: location.id,
          customerId: customer?.id,
          lineItems,
          taxes: taxes.length ? taxes : undefined,
          discounts: discounts.length ? discounts : undefined,
        },
        idempotencyKey: crypto.randomUUID(),
      })

      const order = orderResponse.order
      if (!order?.id || !order.totalMoney?.amount) continue

      const tenderType = pickRandom(ORDER_CONFIG.tenderTypes)

      if (tenderType === "CARD") {
        await client.payments.create({
          sourceId: "cnon:card-nonce-ok",
          idempotencyKey: crypto.randomUUID(),
          amountMoney: { amount: order.totalMoney.amount, currency: "USD" },
          orderId: order.id,
          locationId: location.id,
          customerId: customer?.id,
          tipMoney:
            Math.random() > 0.5
              ? { amount: BigInt(randomInt(100, 500)), currency: "USD" }
              : undefined,
        })
      } else {
        await client.payments.create({
          sourceId: "CASH",
          idempotencyKey: crypto.randomUUID(),
          amountMoney: { amount: order.totalMoney.amount, currency: "USD" },
          orderId: order.id,
          locationId: location.id,
          customerId: customer?.id,
          cashDetails: {
            buyerSuppliedMoney: { amount: order.totalMoney.amount, currency: "USD" },
          },
        })
      }

      squareOrderIds.push(order.id)
      createdForDay++
    }

    console.log(`  ${day}: ${createdForDay} orders created (total: ${squareOrderIds.length})`)
    await delay(200)
  }

  return squareOrderIds
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const token = process.env.SQUARE_APP_ACCESS_TOKEN
  if (!token) {
    console.error("Error: SQUARE_APP_ACCESS_TOKEN environment variable is required")
    process.exit(1)
  }

  const environment = getSquareEnvironment()
  const squareEnvironment =
    environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox
  const client = new SquareClient({ token, environment: squareEnvironment })

  console.log(`Seeding Square ${environment} data...\n`)

  const locations = await listLocations(client)
  console.log(`Using ${locations.length} location(s): ${locations.map((l) => l.name).join(", ")}\n`)

  const variationCount = CATALOG_ITEMS.reduce((sum, item) => sum + item.variations.length, 0)
  console.log(
    `Creating catalog: ${CATEGORIES.length} categories, ${DISCOUNTS.length} discounts, ${TAXES.length} taxes, ${MODIFIER_LISTS.length} modifier lists, ${CATALOG_ITEMS.length} items (${variationCount} variations)...`,
  )
  const catalog = await createCatalogObjects(client)
  console.log(
    `  Created ${Object.keys(catalog.discountIds).length} discounts, ${Object.keys(catalog.taxIds).length} taxes, ${Object.keys(catalog.modifierListIds).length} modifier lists, ${catalog.variations.length} variations\n`,
  )

  console.log(`Fetching modifier IDs per list...`)
  const modifiersByListKey = await fetchModifierIdsByList(client, catalog.modifierListIds)
  const totalModifiers = Object.values(modifiersByListKey).reduce((sum, ids) => sum + ids.length, 0)
  console.log(`  Resolved ${totalModifiers} modifiers\n`)

  const locationIds = locations.map((l) => l.id!).filter(Boolean)
  console.log(
    `Seeding inventory for ${catalog.variations.length} variations across ${locationIds.length} location(s)...`,
  )
  const stockedCount = await seedInventory(client, locationIds, catalog.variations)
  console.log(`  Applied ${stockedCount} PHYSICAL_COUNT changes\n`)

  console.log(`Creating ${CUSTOMERS.length} customers...`)
  const customers = await createCustomers(client)
  console.log(`  Created ${customers.length} customers\n`)

  console.log(
    `Creating orders from ${ORDER_CONFIG.dateRangeFrom} to ${ORDER_CONFIG.dateRangeTo}...`,
  )
  const squareOrderIds = await createOrders(
    client,
    locations,
    catalog,
    modifiersByListKey,
    customers,
  )

  const output: SeedOutput = {
    createdAt: new Date().toISOString(),
    dateRangeFrom: ORDER_CONFIG.dateRangeFrom,
    dateRangeTo: ORDER_CONFIG.dateRangeTo,
    squareOrderIds,
  }
  const outputPath = resolve(import.meta.dirname, SEED_OUTPUT_FILE)
  writeFileSync(outputPath, JSON.stringify(output, null, 2))

  console.log(`\nSeeding complete! Created ${squareOrderIds.length} orders.`)
  console.log(`Wrote ${SEED_OUTPUT_FILE} with ${squareOrderIds.length} order IDs.`)
  console.log(`\nNext steps:`)
  console.log(`  1. Trigger a manual Square sync from the UI (or run the nightly job).`)
  console.log(`  2. Run:  pnpm --filter @analytics/seed-square backdate --customer-id=<id>`)
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
