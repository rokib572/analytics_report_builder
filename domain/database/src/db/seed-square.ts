import { createHash } from "node:crypto"
import { config } from "dotenv"
import { and, eq } from "drizzle-orm"
import { getDbClient } from "./client"
import {
  SEED_CATALOG_CATEGORIES,
  SEED_CHANNELS,
  SEED_INVENTORY_CONFIG,
  SEED_LABOR_CONFIG,
  SEED_LOCATIONS,
  SEED_MENU_ITEMS,
  SEED_ORDER_CONFIG,
  SEED_REFUND_CONFIG,
  SEED_SQUARE_CUSTOMERS,
  SEED_TEAM_MEMBERS,
} from "./seed-square-data"
import { customers } from "../modules/customers/schema"
import { upsertCustomers } from "../modules/square/customers/functions/upsert"
import { type ChannelDto } from "../modules/square/channels/schema"
import { upsertChannelBySourceName } from "../modules/square/channels/functions/upsert-by-source-name"
import { locations, type LocationPayload } from "../modules/square/locations/schema"
import { upsertLocation } from "../modules/square/locations/functions/upsert"
import { upsertCatalogCategory } from "../modules/square/catalog-categories/functions/upsert"
import { upsertCatalogItem } from "../modules/square/catalog-items/functions/upsert"
import { upsertCatalogItemVariation } from "../modules/square/catalog-item-variations/functions/upsert"
import { orders } from "../modules/square/orders/schema"
import { upsertOrder } from "../modules/square/orders/functions/upsert"
import { type OrderLineItemPayload } from "../modules/square/order-line-items/schema"
import { bulkInsertOrderLineItems } from "../modules/square/order-line-items/functions/bulk-insert"
import { deleteOrderLineItemsByOrderId } from "../modules/square/order-line-items/functions/delete-by-order"
import { type OrderTenderPayload } from "../modules/square/order-tenders/schema"
import { bulkInsertOrderTenders } from "../modules/square/order-tenders/functions/bulk-insert"
import { deleteOrderTendersByOrderId } from "../modules/square/order-tenders/functions/delete-by-order"
import { type OrderFulfillmentPayload } from "../modules/square/order-fulfillments/schema"
import { bulkInsertOrderFulfillments } from "../modules/square/order-fulfillments/functions/bulk-insert"
import { deleteOrderFulfillmentsByOrderId } from "../modules/square/order-fulfillments/functions/delete-by-order"
import { upsertPayment } from "../modules/square/payments/functions/upsert"
import { type DailySalesPayload } from "../modules/square/daily-sales/schema"
import { upsertDailySales } from "../modules/square/daily-sales/functions/upsert"
import { upsertInventoryCount } from "../modules/square/inventory-counts/functions/upsert"
import { upsertInventoryAdjustment } from "../modules/square/inventory-adjustments/functions/upsert"
import { upsertInventoryTransfer } from "../modules/square/inventory-transfers/functions/upsert"
import { upsertRefund } from "../modules/square/refunds/functions/upsert"
import { upsertLaborTimecard } from "../modules/square/labor-timecards/functions/upsert"
import { upsertLaborScheduledShift } from "../modules/square/labor-scheduled-shifts/functions/upsert"

config({ path: "../../.env" })

type CliArgs = {
  customerId: string
}

type SeededLocation = {
  id: string
  squareId: string
  name: string
  timezone: string
}

type SeededVariation = {
  variationDbId: string
  catalogObjectId: string
  itemName: string
  variationName: string
  categoryName: string
  priceCents: number
}

type SeededOrderRecord = {
  orderId: string
  squareOrderId: string
  squarePaymentId: string
  location: SeededLocation
  createdAt: Date
  totalMoney: bigint
  totalTaxMoney: bigint
  totalDiscountMoney: bigint
  totalTipMoney: bigint
  totalServiceChargeMoney: bigint
  squareCustomerId: string | null
}

type SeededChannel = (typeof SEED_CHANNELS)[number] & { id: string }

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2)
  let customerId: string | undefined

  for (const arg of args) {
    if (arg.startsWith("--customer-id=")) customerId = arg.slice("--customer-id=".length)
  }

  if (!customerId) {
    console.error("Error: --customer-id=<id> is required")
    console.error("Usage: pnpm --filter @analytics/database db:seed:square --customer-id=<id>")
    process.exit(1)
  }

  return { customerId }
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(items: readonly T[]): T => items[randomInt(0, items.length - 1)]!

const maybePickRandom = <T>(items: readonly T[], probability: number): T | undefined =>
  Math.random() < probability ? pickRandom(items) : undefined

const normalizeJsonValue = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((item) => normalizeJsonValue(item))
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeJsonValue(nestedValue)]),
    )
  }
  return value
}

const computeContentHash = (data: Record<string, unknown>): string => {
  const normalized = normalizeJsonValue(data)
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex")
}

const getDateRange = (from: string, to: string): string[] => {
  const dates: string[] = []
  const current = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

const randomTimestampOnDate = (dateStr: string, hourMin = 7, hourMax = 21): Date => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(
    Date.UTC(
      year!,
      month! - 1,
      day!,
      randomInt(hourMin, hourMax),
      randomInt(0, 59),
      randomInt(0, 59),
      randomInt(0, 999),
    ),
  )
}

const slugify = (value: string): string => value.toLowerCase().replaceAll(" ", "-")

const catalogObjectIdFor = (itemName: string, variationName: string): string =>
  `db-seed-catalog-${slugify(itemName)}-${slugify(variationName)}`

const catalogItemSquareIdFor = (itemName: string): string => `db-seed-item-${slugify(itemName)}`

const ensureCustomerExists = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
): Promise<void> => {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)

  if (!customer) {
    throw new Error(`Customer '${customerId}' does not exist`)
  }
}

const seedChannels = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
): Promise<SeededChannel[]> => {
  const seeded: SeededChannel[] = []
  for (const channel of SEED_CHANNELS) {
    const record: ChannelDto = await upsertChannelBySourceName(db, customerId, channel.sourceName)
    seeded.push({ ...channel, id: record.id })
  }
  return seeded
}

const pickWeightedChannel = (channels: SeededChannel[]): SeededChannel => {
  const totalWeight = channels.reduce((accumulator, channel) => accumulator + channel.weight, 0)
  let roll = Math.random() * totalWeight
  for (const channel of channels) {
    roll -= channel.weight
    if (roll <= 0) return channel
  }
  return channels[channels.length - 1]!
}

const seedSquareCustomers = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
): Promise<void> => {
  for (const customer of SEED_SQUARE_CUSTOMERS) {
    await upsertCustomers(db, customerId, {
      squareId: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      emailAddress: customer.email,
      phoneNumber: customer.phone,
      referenceId: null,
      creationSource: "DB Seed",
      creationTime: new Date("2025-12-01T00:00:00Z"),
      contentHash: computeContentHash(customer as unknown as Record<string, unknown>),
    })
  }
}

const seedLocations = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
): Promise<SeededLocation[]> => {
  const seeded: SeededLocation[] = []

  for (const location of SEED_LOCATIONS) {
    const payload: LocationPayload = {
      squareId: location.squareId,
      name: location.name,
      address: location.address,
      status: "ACTIVE",
      timezone: location.timezone,
      contentHash: computeContentHash(location as unknown as Record<string, unknown>),
    }

    await upsertLocation(db, customerId, payload)

    const [saved] = await db
      .select({ id: locations.id, squareId: locations.squareId, name: locations.name })
      .from(locations)
      .where(and(eq(locations.customerId, customerId), eq(locations.squareId, location.squareId)))
      .limit(1)

    if (!saved) {
      throw new Error(`Failed to seed location ${location.squareId}`)
    }

    seeded.push({ ...saved, timezone: location.timezone })
  }

  return seeded
}

const seedCatalog = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
): Promise<SeededVariation[]> => {
  for (const category of SEED_CATALOG_CATEGORIES) {
    await upsertCatalogCategory(db, customerId, {
      squareId: category.squareId,
      name: category.name,
      parentCategoryId: null,
      isTopLevel: true,
      contentHash: computeContentHash(category as unknown as Record<string, unknown>),
    })
  }

  const itemSquareIdToDbId = new Map<string, string>()
  const uniqueItems = new Map<string, string>()
  for (const menuItem of SEED_MENU_ITEMS) {
    if (!uniqueItems.has(menuItem.name)) uniqueItems.set(menuItem.name, menuItem.category)
  }

  for (const [itemName, categoryName] of uniqueItems) {
    const itemSquareId = catalogItemSquareIdFor(itemName)
    const category = SEED_CATALOG_CATEGORIES.find((entry) => entry.name === categoryName)
    if (!category) throw new Error(`Unknown category '${categoryName}' for item ${itemName}`)

    const item = await upsertCatalogItem(db, customerId, {
      squareId: itemSquareId,
      name: itemName,
      description: null,
      categoryId: category.squareId,
      isArchived: false,
      reportingCategoryId: category.squareId,
      contentHash: computeContentHash({ itemName, categorySquareId: category.squareId }),
    })

    if (!item) throw new Error(`Failed to seed catalog item ${itemSquareId}`)
    itemSquareIdToDbId.set(itemSquareId, item.id)
  }

  const variations: SeededVariation[] = []

  for (const menuItem of SEED_MENU_ITEMS) {
    const catalogObjectId = catalogObjectIdFor(menuItem.name, menuItem.variationName)
    const itemDbId = itemSquareIdToDbId.get(catalogItemSquareIdFor(menuItem.name))
    if (!itemDbId) throw new Error(`Missing item db id for ${menuItem.name}`)

    const variation = await upsertCatalogItemVariation(db, customerId, {
      squareId: catalogObjectId,
      itemId: itemDbId,
      name: menuItem.variationName,
      sku: null,
      priceMoney: BigInt(menuItem.price),
      priceCurrency: "USD",
      ordinal: 0,
      contentHash: computeContentHash({
        catalogObjectId,
        itemDbId,
        variationName: menuItem.variationName,
        price: menuItem.price,
      }),
    })

    if (!variation) throw new Error(`Failed to seed variation ${catalogObjectId}`)

    variations.push({
      variationDbId: variation.id,
      catalogObjectId,
      itemName: menuItem.name,
      variationName: menuItem.variationName,
      categoryName: menuItem.category,
      priceCents: menuItem.price,
    })
  }

  return variations
}

const toMoney = (amount: bigint) => ({ amount, currency: "USD" as const })

const buildOrderSeed = (
  date: string,
  location: SeededLocation,
  sequence: number,
  variations: SeededVariation[],
  channel: SeededChannel,
) => {
  const createdAt = randomTimestampOnDate(date)
  const lineItemCount = randomInt(
    SEED_ORDER_CONFIG.lineItemsPerOrder.min,
    SEED_ORDER_CONFIG.lineItemsPerOrder.max,
  )

  const lineItems: OrderLineItemPayload[] = []
  let subtotal = 0n
  const variationUsage = new Map<string, bigint>()

  for (let index = 0; index < lineItemCount; index++) {
    const variation = pickRandom(variations)
    const quantity = BigInt(randomInt(1, 3))
    const grossSalesMoney = BigInt(variation.priceCents) * quantity
    subtotal += grossSalesMoney

    variationUsage.set(
      variation.catalogObjectId,
      (variationUsage.get(variation.catalogObjectId) ?? 0n) + quantity,
    )

    lineItems.push({
      orderId: "",
      locationId: location.id,
      saleDate: date,
      name: variation.itemName,
      variationName: variation.variationName,
      catalogObjectId: variation.catalogObjectId,
      quantity: quantity.toString(),
      channel: channel.lineItemChannel,
      basePriceMoney: BigInt(variation.priceCents),
      grossSalesMoney,
      totalDiscountMoney: 0n,
      totalTaxMoney: 0n,
      totalMoney: grossSalesMoney,
      modifiers: null,
      appliedDiscounts: null,
      appliedTaxes: null,
    })
  }

  const orderDiscountMoney =
    maybePickRandom(
      SEED_ORDER_CONFIG.fixedDiscountOptions,
      SEED_ORDER_CONFIG.discountProbability,
    ) ?? 0n
  const discountedSubtotal = subtotal - orderDiscountMoney
  const totalTaxMoney =
    (discountedSubtotal * BigInt(Math.round(SEED_ORDER_CONFIG.salesTaxPercentage * 100))) / 10000n
  const totalTipMoney =
    Math.random() < SEED_ORDER_CONFIG.tipProbability ? BigInt(randomInt(100, 500)) : 0n
  const totalServiceChargeMoney = 0n
  const totalMoney = discountedSubtotal + totalTaxMoney + totalTipMoney + totalServiceChargeMoney
  const customer = maybePickRandom(SEED_SQUARE_CUSTOMERS, SEED_ORDER_CONFIG.customerProbability)
  const tenderType = pickRandom(SEED_ORDER_CONFIG.tenderTypes)
  const cardBrand = tenderType === "CARD" ? pickRandom(SEED_ORDER_CONFIG.cardBrands) : null
  const cardLast4 = tenderType === "CARD" ? String(randomInt(1000, 9999)) : null

  const squareOrderId = `db-seed-order-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`
  const squarePaymentId = `db-seed-payment-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`
  const squareTenderId = `db-seed-tender-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`
  const squareFulfillmentUid = `db-seed-fulfillment-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`

  const rawOrder = {
    id: squareOrderId,
    locationId: location.squareId,
    state: "COMPLETED",
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    closedAt: createdAt.toISOString(),
    customerId: customer?.id ?? null,
    source: { name: channel.sourceName },
    lineItems: lineItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      variationName: item.variationName,
      catalogObjectId: item.catalogObjectId,
      basePriceMoney: toMoney(item.basePriceMoney ?? 0n),
      grossSalesMoney: toMoney(item.grossSalesMoney ?? 0n),
      totalDiscountMoney: toMoney(item.totalDiscountMoney ?? 0n),
      totalTaxMoney: toMoney(item.totalTaxMoney ?? 0n),
      totalMoney: toMoney(item.totalMoney ?? 0n),
    })),
    totalMoney: toMoney(totalMoney),
    totalTaxMoney: toMoney(totalTaxMoney),
    totalDiscountMoney: toMoney(orderDiscountMoney),
    totalTipMoney: toMoney(totalTipMoney),
    totalServiceChargeMoney: toMoney(totalServiceChargeMoney),
    netAmounts: {
      totalMoney,
      taxMoney: totalTaxMoney,
      discountMoney: orderDiscountMoney,
      tipMoney: totalTipMoney,
      serviceChargeMoney: totalServiceChargeMoney,
    },
    returnAmounts: {
      totalMoney: 0n,
    },
  }

  return {
    createdAt,
    squareOrderId,
    squarePaymentId,
    squareTenderId,
    squareFulfillmentUid,
    customer,
    tenderType,
    cardBrand,
    cardLast4,
    subtotal,
    orderDiscountMoney,
    totalTaxMoney,
    totalTipMoney,
    totalServiceChargeMoney,
    totalMoney,
    rawOrder,
    lineItems,
    variationUsage,
  }
}

const seedOrdersForLocations = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  channels: SeededChannel[],
  seededLocations: SeededLocation[],
  variations: SeededVariation[],
): Promise<{
  orderRecords: SeededOrderRecord[]
  variationSalesByLocation: Map<string, Map<string, bigint>>
}> => {
  const orderRecords: SeededOrderRecord[] = []
  const variationSalesByLocation = new Map<string, Map<string, bigint>>()
  const dates = getDateRange(SEED_ORDER_CONFIG.dateRangeFrom, SEED_ORDER_CONFIG.dateRangeTo)

  for (const date of dates) {
    for (const location of seededLocations) {
      const ordersForLocationToday = randomInt(
        SEED_ORDER_CONFIG.ordersPerDayPerLocation.min,
        SEED_ORDER_CONFIG.ordersPerDayPerLocation.max,
      )

      for (let sequence = 1; sequence <= ordersForLocationToday; sequence++) {
        const channel = pickWeightedChannel(channels)
        const orderSeed = buildOrderSeed(date, location, sequence, variations, channel)
        const fulfillmentType = channel.lineItemChannel === "store" ? "PICKUP" : "DELIVERY"

        const orderPayload = {
          squareId: orderSeed.squareOrderId,
          locationId: location.id,
          channelId: channel.id,
          saleDate: date,
          state: "COMPLETED",
          totalMoney: orderSeed.totalMoney,
          totalTaxMoney: orderSeed.totalTaxMoney,
          totalDiscountMoney: orderSeed.orderDiscountMoney,
          totalTipMoney: orderSeed.totalTipMoney,
          totalServiceChargeMoney: orderSeed.totalServiceChargeMoney,
          netAmounts: normalizeJsonValue(orderSeed.rawOrder.netAmounts) as Record<string, unknown>,
          returnAmounts: normalizeJsonValue(orderSeed.rawOrder.returnAmounts) as Record<
            string,
            unknown
          >,
          sourceName: channel.sourceName,
          squareCustomerId: orderSeed.customer?.id ?? null,
          ticketName: null,
          closedAt: orderSeed.createdAt,
          fulfillmentType,
          rawJson: normalizeJsonValue(orderSeed.rawOrder) as Record<string, unknown>,
          contentHash: computeContentHash(orderSeed.rawOrder as unknown as Record<string, unknown>),
          createdAt: orderSeed.createdAt,
          updatedAt: orderSeed.createdAt,
        }

        await upsertOrder(db, customerId, orderPayload)

        const [savedOrder] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(
            and(eq(orders.customerId, customerId), eq(orders.squareId, orderSeed.squareOrderId)),
          )
          .limit(1)

        if (!savedOrder) {
          throw new Error(`Failed to seed order ${orderSeed.squareOrderId}`)
        }

        await deleteOrderLineItemsByOrderId(db, savedOrder.id)
        await bulkInsertOrderLineItems(
          db,
          orderSeed.lineItems.map((item) => ({ ...item, orderId: savedOrder.id })),
        )

        const tenderPayload: OrderTenderPayload = {
          orderId: savedOrder.id,
          locationId: location.id,
          squareId: orderSeed.squareTenderId,
          type: orderSeed.tenderType,
          amountMoney: orderSeed.totalMoney - orderSeed.totalTipMoney,
          tipMoney: orderSeed.totalTipMoney,
          processingFeeMoney: orderSeed.tenderType === "CARD" ? BigInt(randomInt(15, 60)) : 0n,
          cardBrand: orderSeed.cardBrand,
          cardLast4: orderSeed.cardLast4,
          cardEntryMethod: orderSeed.tenderType === "CARD" ? "KEYED" : null,
          squareCustomerId: orderSeed.customer?.id ?? null,
          paymentId: orderSeed.squarePaymentId,
        }

        await deleteOrderTendersByOrderId(db, savedOrder.id)
        await bulkInsertOrderTenders(db, [tenderPayload])

        const fulfillmentPayload: OrderFulfillmentPayload = {
          orderId: savedOrder.id,
          squareUid: orderSeed.squareFulfillmentUid,
          type: "PICKUP",
          state: "COMPLETED",
          pickupAt: orderSeed.createdAt,
          deliveredAt: null,
          canceledAt: null,
        }

        await deleteOrderFulfillmentsByOrderId(db, savedOrder.id)
        await bulkInsertOrderFulfillments(db, [fulfillmentPayload])

        const paymentContent = {
          squareId: orderSeed.squarePaymentId,
          orderId: savedOrder.id,
          sourceType: orderSeed.tenderType,
          amountMoney: orderSeed.subtotal - orderSeed.orderDiscountMoney,
          tipMoney: orderSeed.totalTipMoney,
          totalMoney: orderSeed.totalMoney,
          cardBrand: orderSeed.cardBrand,
        }

        await upsertPayment(db, customerId, {
          squareId: orderSeed.squarePaymentId,
          locationId: location.id,
          orderId: savedOrder.id,
          status: "COMPLETED",
          sourceType: orderSeed.tenderType,
          amountMoney: paymentContent.amountMoney,
          tipMoney: paymentContent.tipMoney,
          totalMoney: paymentContent.totalMoney,
          appFeeMoney: 0n,
          refundedMoney: 0n,
          processingFeeMoney: tenderPayload.processingFeeMoney ?? 0n,
          cardBrand: orderSeed.cardBrand,
          cardLast4: orderSeed.cardLast4,
          cardEntryMethod: orderSeed.tenderType === "CARD" ? "KEYED" : null,
          riskLevel: orderSeed.tenderType === "CARD" ? "NORMAL" : null,
          squareCustomerId: orderSeed.customer?.id ?? null,
          teamMemberId: null,
          deviceId: null,
          applicationId: "db-seed-app",
          receiptUrl: null,
          contentHash: computeContentHash(paymentContent as unknown as Record<string, unknown>),
          createdAt: orderSeed.createdAt,
          updatedAt: orderSeed.createdAt,
        })

        orderRecords.push({
          orderId: savedOrder.id,
          squareOrderId: orderSeed.squareOrderId,
          squarePaymentId: orderSeed.squarePaymentId,
          location,
          createdAt: orderSeed.createdAt,
          totalMoney: orderSeed.totalMoney,
          totalTaxMoney: orderSeed.totalTaxMoney,
          totalDiscountMoney: orderSeed.orderDiscountMoney,
          totalTipMoney: orderSeed.totalTipMoney,
          totalServiceChargeMoney: orderSeed.totalServiceChargeMoney,
          squareCustomerId: orderSeed.customer?.id ?? null,
        })

        const locationVariationSales =
          variationSalesByLocation.get(location.id) ?? new Map<string, bigint>()
        for (const [catalogObjectId, quantity] of orderSeed.variationUsage) {
          locationVariationSales.set(
            catalogObjectId,
            (locationVariationSales.get(catalogObjectId) ?? 0n) + quantity,
          )
        }
        variationSalesByLocation.set(location.id, locationVariationSales)
      }
    }
  }

  return { orderRecords, variationSalesByLocation }
}

const seedDailySales = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  orderRecords: SeededOrderRecord[],
): Promise<number> => {
  const payloads = new Map<string, Required<DailySalesPayload>>()

  for (const order of orderRecords) {
    const saleDate = order.createdAt.toISOString().slice(0, 10)
    const key = `${order.location.id}|${saleDate}`
    const grossSales = order.totalMoney - order.totalTaxMoney - order.totalTipMoney
    const existing = payloads.get(key)

    if (existing) {
      existing.grossSales += grossSales
      existing.totalDiscounts += order.totalDiscountMoney
      existing.netSales += grossSales - order.totalDiscountMoney
      existing.totalTax += order.totalTaxMoney
      existing.totalTips += order.totalTipMoney
      existing.totalServiceCharges += order.totalServiceChargeMoney
      existing.totalCollected += order.totalMoney
      existing.storeGrossSales += grossSales
      existing.orderCount += 1
      continue
    }

    payloads.set(key, {
      locationId: order.location.id,
      saleDate,
      grossSales,
      totalDiscounts: order.totalDiscountMoney,
      totalReturns: 0n,
      netSales: grossSales - order.totalDiscountMoney,
      totalTax: order.totalTaxMoney,
      totalTips: order.totalTipMoney,
      totalServiceCharges: order.totalServiceChargeMoney,
      totalCollected: order.totalMoney,
      storeGrossSales: grossSales,
      uberGrossSales: 0n,
      uberBogoDiscountAmount: 0n,
      uberBogoRecoverable: 0n,
      orderCount: 1,
      syncSource: "db-seed",
    })
  }

  for (const payload of payloads.values()) {
    await upsertDailySales(db, customerId, payload)
  }

  return payloads.size
}

const seedInventoryCounts = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
  variations: SeededVariation[],
  variationSalesByLocation: Map<string, Map<string, bigint>>,
): Promise<number> => {
  let count = 0
  const calculatedAt = new Date(`${SEED_ORDER_CONFIG.dateRangeTo}T23:59:59Z`)

  for (const location of seededLocations) {
    const sales = variationSalesByLocation.get(location.id) ?? new Map<string, bigint>()

    for (const variation of variations) {
      const sold = sales.get(variation.catalogObjectId) ?? 0n
      const remaining = BigInt(SEED_INVENTORY_CONFIG.initialStockPerVariation) - sold
      const stockOnHand = remaining > 0n ? remaining : 0n

      await upsertInventoryCount(db, customerId, {
        locationId: location.id,
        catalogObjectId: variation.catalogObjectId,
        catalogItemVariationId: variation.variationDbId,
        catalogObjectType: "ITEM_VARIATION",
        state: "IN_STOCK",
        quantity: stockOnHand.toString(),
        isEstimated: false,
        calculatedAt,
        contentHash: computeContentHash({
          locationId: location.id,
          catalogObjectId: variation.catalogObjectId,
          state: "IN_STOCK",
          quantity: stockOnHand.toString(),
        }),
      })
      count += 1
    }
  }

  return count
}

const seedInventoryAdjustments = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
  variations: SeededVariation[],
): Promise<number> => {
  let count = 0
  const dates = getDateRange(SEED_ORDER_CONFIG.dateRangeFrom, SEED_ORDER_CONFIG.dateRangeTo)
  const weekStartDates = dates.filter((_, index) => index % 7 === 0)

  for (const weekStart of weekStartDates) {
    for (const location of seededLocations) {
      const wasteCount = randomInt(
        SEED_INVENTORY_CONFIG.wasteAdjustmentsPerWeek.min,
        SEED_INVENTORY_CONFIG.wasteAdjustmentsPerWeek.max,
      )

      for (let index = 0; index < wasteCount; index++) {
        const variation = pickRandom(variations)
        const occurredAt = randomTimestampOnDate(weekStart)
        const quantity = randomInt(
          SEED_INVENTORY_CONFIG.wasteQuantityRange.min,
          SEED_INVENTORY_CONFIG.wasteQuantityRange.max,
        )
        const squareId = `db-seed-adj-waste-${weekStart}-${location.squareId}-${index.toString().padStart(2, "0")}`

        await upsertInventoryAdjustment(db, customerId, {
          locationId: location.id,
          squareId,
          catalogObjectId: variation.catalogObjectId,
          catalogItemVariationId: variation.variationDbId,
          catalogObjectType: "ITEM_VARIATION",
          fromState: "IN_STOCK",
          toState: "WASTE",
          quantity: quantity.toString(),
          totalPriceMoney: BigInt(variation.priceCents) * BigInt(quantity),
          occurredAt,
          createdAt: occurredAt,
          teamMemberId: pickRandom(SEED_TEAM_MEMBERS).id,
          transactionId: null,
          refundId: null,
          purchaseOrderId: null,
          goodsReceiptId: null,
          reason: "Spoiled",
          contentHash: computeContentHash({ squareId, quantity }),
        })
        count += 1
      }

      const receiptCount = randomInt(
        SEED_INVENTORY_CONFIG.receiptAdjustmentsPerWeek.min,
        SEED_INVENTORY_CONFIG.receiptAdjustmentsPerWeek.max,
      )

      for (let index = 0; index < receiptCount; index++) {
        const variation = pickRandom(variations)
        const occurredAt = randomTimestampOnDate(weekStart)
        const quantity = randomInt(
          SEED_INVENTORY_CONFIG.receiptQuantityRange.min,
          SEED_INVENTORY_CONFIG.receiptQuantityRange.max,
        )
        const squareId = `db-seed-adj-receipt-${weekStart}-${location.squareId}-${index.toString().padStart(2, "0")}`

        await upsertInventoryAdjustment(db, customerId, {
          locationId: location.id,
          squareId,
          catalogObjectId: variation.catalogObjectId,
          catalogItemVariationId: variation.variationDbId,
          catalogObjectType: "ITEM_VARIATION",
          fromState: "NONE",
          toState: "IN_STOCK",
          quantity: quantity.toString(),
          totalPriceMoney: null,
          occurredAt,
          createdAt: occurredAt,
          teamMemberId: pickRandom(SEED_TEAM_MEMBERS).id,
          transactionId: null,
          refundId: null,
          purchaseOrderId: `db-seed-po-${weekStart}-${index}`,
          goodsReceiptId: `db-seed-gr-${weekStart}-${index}`,
          reason: "Stock receipt",
          contentHash: computeContentHash({ squareId, quantity }),
        })
        count += 1
      }
    }
  }

  return count
}

const seedInventoryTransfers = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
  variations: SeededVariation[],
): Promise<number> => {
  if (seededLocations.length < 2) return 0

  let count = 0
  const dates = getDateRange(SEED_ORDER_CONFIG.dateRangeFrom, SEED_ORDER_CONFIG.dateRangeTo)
  const weekStartDates = dates.filter((_, index) => index % 7 === 0)

  for (const weekStart of weekStartDates) {
    const transferCount = randomInt(
      SEED_INVENTORY_CONFIG.transferAdjustmentsPerWeek.min,
      SEED_INVENTORY_CONFIG.transferAdjustmentsPerWeek.max,
    )

    for (let index = 0; index < transferCount; index++) {
      const fromLocation = pickRandom(seededLocations)
      const candidateDestinations = seededLocations.filter((loc) => loc.id !== fromLocation.id)
      const toLocation = pickRandom(candidateDestinations)
      const variation = pickRandom(variations)
      const occurredAt = randomTimestampOnDate(weekStart)
      const quantity = randomInt(
        SEED_INVENTORY_CONFIG.transferQuantityRange.min,
        SEED_INVENTORY_CONFIG.transferQuantityRange.max,
      )
      const squareId = `db-seed-transfer-${weekStart}-${fromLocation.squareId}-${toLocation.squareId}-${index.toString().padStart(2, "0")}`

      await upsertInventoryTransfer(db, customerId, {
        squareId,
        catalogObjectId: variation.catalogObjectId,
        catalogItemVariationId: variation.variationDbId,
        catalogObjectType: "ITEM_VARIATION",
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        fromSquareLocationId: fromLocation.squareId,
        toSquareLocationId: toLocation.squareId,
        state: "COMPLETED",
        quantity: quantity.toString(),
        occurredAt,
        createdAt: occurredAt,
        teamMemberId: pickRandom(SEED_TEAM_MEMBERS).id,
        contentHash: computeContentHash({ squareId, quantity }),
      })
      count += 1
    }
  }

  return count
}

const seedRefunds = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  orderRecords: SeededOrderRecord[],
): Promise<number> => {
  let count = 0

  for (const order of orderRecords) {
    if (Math.random() >= SEED_REFUND_CONFIG.refundProbability) continue

    const refundedAt = new Date(order.createdAt.getTime() + 1000 * 60 * 60 * randomInt(2, 72))
    const refundAmount = order.totalMoney
    const reason = pickRandom(SEED_REFUND_CONFIG.refundReasons)
    const squareId = `db-seed-refund-${order.squareOrderId}`

    await upsertRefund(db, customerId, {
      locationId: order.location.id,
      squareId,
      paymentId: order.squarePaymentId,
      orderId: order.squareOrderId,
      status: "COMPLETED",
      amountMoney: refundAmount,
      appFeeMoney: 0n,
      processingFeeMoney: 0n,
      reason,
      destinationType: "CARD",
      unlinked: false,
      teamMemberId: pickRandom(SEED_TEAM_MEMBERS).id,
      squareCustomerId: order.squareCustomerId,
      contentHash: computeContentHash({ squareId, refundAmount: refundAmount.toString() }),
      createdAt: refundedAt,
      updatedAt: refundedAt,
    })

    count += 1
  }

  return count
}

const seedLaborShiftsAndTimecards = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
): Promise<{ scheduledShifts: number; timecards: number }> => {
  let scheduledShifts = 0
  let timecards = 0
  const dates = getDateRange(SEED_ORDER_CONFIG.dateRangeFrom, SEED_ORDER_CONFIG.dateRangeTo)

  for (const date of dates) {
    for (const location of seededLocations) {
      for (
        let patternIndex = 0;
        patternIndex < SEED_LABOR_CONFIG.shiftPatterns.length;
        patternIndex++
      ) {
        const pattern = SEED_LABOR_CONFIG.shiftPatterns[patternIndex]!
        const staffCount = randomInt(
          SEED_LABOR_CONFIG.staffPerShiftPerLocation.min,
          SEED_LABOR_CONFIG.staffPerShiftPerLocation.max,
        )
        const assignedStaff = SEED_TEAM_MEMBERS.slice(0, staffCount)

        for (let staffIndex = 0; staffIndex < assignedStaff.length; staffIndex++) {
          const teamMember = assignedStaff[staffIndex]!
          const startAt = new Date(
            `${date}T${pattern.startHour.toString().padStart(2, "0")}:00:00Z`,
          )
          const endAt = new Date(`${date}T${pattern.endHour.toString().padStart(2, "0")}:00:00Z`)
          const scheduledMinutes = BigInt((pattern.endHour - pattern.startHour) * 60)
          const shiftSquareId = `db-seed-shift-${date}-${location.squareId}-${patternIndex}-${staffIndex}`

          await upsertLaborScheduledShift(db, customerId, {
            locationId: location.id,
            squareId: shiftSquareId,
            teamMemberId: teamMember.id,
            jobTitle: teamMember.jobTitle,
            jobId: teamMember.jobId,
            workDate: date,
            startAt,
            endAt,
            scheduledMinutes,
            status: "PUBLISHED",
            notes: null,
            contentHash: computeContentHash({
              shiftSquareId,
              scheduledMinutes: scheduledMinutes.toString(),
            }),
            squareCreatedAt: startAt,
            squareUpdatedAt: startAt,
          })
          scheduledShifts += 1

          const completed = Math.random() < SEED_LABOR_CONFIG.workedShiftCompletionProbability
          if (!completed) continue

          const totalPaidMillis = scheduledMinutes * 60n * 1000n
          const totalPaidHoursMilli =
            (scheduledMinutes - BigInt(SEED_LABOR_CONFIG.unpaidBreakMinutes)) * 60n * 1000n
          const totalLaborCostCents =
            (teamMember.hourlyWageCents *
              (scheduledMinutes - BigInt(SEED_LABOR_CONFIG.unpaidBreakMinutes))) /
            60n
          const declaredCashTipsCents =
            teamMember.jobTitle === "Manager"
              ? 0n
              : BigInt(
                  randomInt(
                    SEED_LABOR_CONFIG.declaredCashTipsRange.min,
                    SEED_LABOR_CONFIG.declaredCashTipsRange.max,
                  ),
                )
          const timecardSquareId = `db-seed-timecard-${date}-${location.squareId}-${patternIndex}-${staffIndex}`

          await upsertLaborTimecard(db, customerId, {
            locationId: location.id,
            squareId: timecardSquareId,
            teamMemberId: teamMember.id,
            jobTitle: teamMember.jobTitle,
            jobId: teamMember.jobId,
            workDate: date,
            startAt,
            endAt,
            status: "COMPLETED",
            hourlyWageCents: teamMember.hourlyWageCents,
            totalPaidHours: totalPaidHoursMilli,
            totalLaborCostCents,
            declaredCashTipsCents,
            paidBreakMinutes: BigInt(SEED_LABOR_CONFIG.paidBreakMinutes),
            unpaidBreakMinutes: BigInt(SEED_LABOR_CONFIG.unpaidBreakMinutes),
            breaks: [
              {
                startAt: new Date(startAt.getTime() + 1000 * 60 * 60 * 2).toISOString(),
                endAt: new Date(
                  startAt.getTime() + 1000 * 60 * (60 * 2 + SEED_LABOR_CONFIG.paidBreakMinutes),
                ).toISOString(),
                isPaid: true,
              },
              {
                startAt: new Date(startAt.getTime() + 1000 * 60 * 60 * 4).toISOString(),
                endAt: new Date(
                  startAt.getTime() + 1000 * 60 * (60 * 4 + SEED_LABOR_CONFIG.unpaidBreakMinutes),
                ).toISOString(),
                isPaid: false,
              },
            ],
            timezone: location.timezone,
            contentHash: computeContentHash({
              timecardSquareId,
              totalPaidMillis: totalPaidMillis.toString(),
            }),
            squareCreatedAt: startAt,
            squareUpdatedAt: endAt,
          })
          timecards += 1
        }
      }
    }
  }

  return { scheduledShifts, timecards }
}

const seedSquareData = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const { customerId } = parseArgs()
  const { db, queryClient } = getDbClient(connectionString, { logQueries: false })

  try {
    await ensureCustomerExists(db, customerId)

    console.log(`Seeding DB Square-like data for customer ${customerId}...`)

    const channels = await seedChannels(db, customerId)
    console.log(
      `  Seeded ${channels.length} channels (${channels.map((channel) => channel.sourceName).join(", ")})`,
    )

    await seedSquareCustomers(db, customerId)
    console.log(`  Seeded ${SEED_SQUARE_CUSTOMERS.length} square customers`)

    const seededLocations = await seedLocations(db, customerId)
    console.log(`  Seeded ${seededLocations.length} locations`)

    const variations = await seedCatalog(db, customerId)
    console.log(
      `  Seeded ${SEED_CATALOG_CATEGORIES.length} catalog categories, ${new Set(variations.map((variation) => variation.itemName)).size} items, ${variations.length} variations`,
    )

    const { orderRecords, variationSalesByLocation } = await seedOrdersForLocations(
      db,
      customerId,
      channels,
      seededLocations,
      variations,
    )
    console.log(
      `  Seeded ${orderRecords.length} orders + line items + tenders + fulfillments + payments`,
    )

    const dailyRowCount = await seedDailySales(db, customerId, orderRecords)
    console.log(`  Upserted ${dailyRowCount} daily_sales rows`)

    const inventoryCountRows = await seedInventoryCounts(
      db,
      customerId,
      seededLocations,
      variations,
      variationSalesByLocation,
    )
    console.log(`  Seeded ${inventoryCountRows} inventory_counts rows`)

    const adjustmentRows = await seedInventoryAdjustments(
      db,
      customerId,
      seededLocations,
      variations,
    )
    console.log(`  Seeded ${adjustmentRows} inventory_adjustments rows (waste + receipts)`)

    const transferRows = await seedInventoryTransfers(db, customerId, seededLocations, variations)
    console.log(`  Seeded ${transferRows} inventory_transfers rows`)

    const refundRows = await seedRefunds(db, customerId, orderRecords)
    console.log(`  Seeded ${refundRows} refunds`)

    const labor = await seedLaborShiftsAndTimecards(db, customerId, seededLocations)
    console.log(
      `  Seeded ${labor.scheduledShifts} labor_scheduled_shifts and ${labor.timecards} labor_timecards`,
    )

    console.log("DB square seed complete.")
  } catch (error) {
    console.error("DB square seed failed:", error)
    process.exit(1)
  } finally {
    await queryClient.end()
  }
}

void seedSquareData()
