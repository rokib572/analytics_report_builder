import { createHash } from "node:crypto"
import { config } from "dotenv"
import { and, eq } from "drizzle-orm"
import { getDbClient } from "./client"
import {
  SEED_LOCATIONS,
  SEED_MENU_ITEMS,
  SEED_ORDER_CONFIG,
  SEED_SQUARE_CUSTOMERS,
} from "./seed-square-data"
import { customers } from "../modules/customers/schema"
import { locations, type LocationPayload } from "../modules/square/locations/schema"
import { upsertLocation } from "../modules/square/locations/functions/upsert"
import { orders } from "../modules/square/orders/schema"
import { upsertOrder } from "../modules/square/orders/functions/upsert"
import { type OrderLineItemPayload } from "../modules/square/order-line-items/schema"
import { bulkInsertOrderLineItems } from "../modules/square/order-line-items/functions/bulk-insert"
import { deleteOrderLineItemsByOrderId } from "../modules/square/order-line-items/functions/delete-by-order"
import { upsertPayment } from "../modules/square/payments/functions/upsert"
import { type DailySalesPayload } from "../modules/square/daily-sales/schema"
import { upsertDailySales } from "../modules/square/daily-sales/functions/upsert"

config({ path: "../../.env" })

type CliArgs = {
  customerId: string
}

type SeededLocation = {
  id: string
  squareId: string
  name: string
}

type SeededOrderAggregate = {
  squareLocationId: string
  createdAt: string
  totalMoney: bigint
  totalTaxMoney: bigint
  totalDiscountMoney: bigint
  totalTipMoney: bigint
  totalServiceChargeMoney: bigint
}

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

const randomTimestampOnDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(
    Date.UTC(
      year!,
      month! - 1,
      day!,
      randomInt(7, 21),
      randomInt(0, 59),
      randomInt(0, 59),
      randomInt(0, 999),
    ),
  )
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

    seeded.push(saved)
  }

  return seeded
}

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

const toMoney = (amount: bigint) => ({ amount, currency: "USD" as const })

const buildOrderSeed = (date: string, location: SeededLocation, sequence: number) => {
  const createdAt = randomTimestampOnDate(date)
  const lineItemCount = randomInt(
    SEED_ORDER_CONFIG.lineItemsPerOrder.min,
    SEED_ORDER_CONFIG.lineItemsPerOrder.max,
  )

  const lineItems: OrderLineItemPayload[] = []
  let subtotal = 0n

  for (let index = 0; index < lineItemCount; index++) {
    const item = pickRandom(SEED_MENU_ITEMS)
    const quantity = BigInt(randomInt(1, 3))
    const grossSalesMoney = BigInt(item.price) * quantity
    subtotal += grossSalesMoney

    lineItems.push({
      orderId: "",
      locationId: location.id,
      saleDate: date,
      name: item.name,
      variationName: item.variationName,
      catalogObjectId: `db-seed-catalog-${item.name.toLowerCase().replaceAll(" ", "-")}-${item.variationName.toLowerCase().replaceAll(" ", "-")}`,
      quantity: quantity.toString(),
      channel: "store",
      basePriceMoney: BigInt(item.price),
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

  const squareOrderId = `db-seed-order-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`
  const squarePaymentId = `db-seed-payment-${date}-${location.squareId}-${sequence.toString().padStart(3, "0")}`

  const rawOrder = {
    id: squareOrderId,
    locationId: location.squareId,
    state: "COMPLETED",
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    closedAt: createdAt.toISOString(),
    customerId: customer?.id ?? null,
    source: { name: "DB Seed" },
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
    customer,
    tenderType,
    cardBrand,
    subtotal,
    orderDiscountMoney,
    totalTaxMoney,
    totalTipMoney,
    totalServiceChargeMoney,
    totalMoney,
    rawOrder,
    lineItems,
  }
}

const seedOrdersForLocations = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
): Promise<SeededOrderAggregate[]> => {
  const aggregates: SeededOrderAggregate[] = []
  const dates = getDateRange(SEED_ORDER_CONFIG.dateRangeFrom, SEED_ORDER_CONFIG.dateRangeTo)

  for (const date of dates) {
    const ordersPerDay = randomInt(
      SEED_ORDER_CONFIG.ordersPerDay.min,
      SEED_ORDER_CONFIG.ordersPerDay.max,
    )

    for (let sequence = 1; sequence <= ordersPerDay; sequence++) {
      const location = pickRandom(seededLocations)
      const orderSeed = buildOrderSeed(date, location, sequence)

      const orderPayload = {
        squareId: orderSeed.squareOrderId,
        locationId: location.id,
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
        sourceName: "DB Seed",
        squareCustomerId: orderSeed.customer?.id ?? null,
        ticketName: null,
        closedAt: orderSeed.createdAt,
        fulfillmentType: "PICKUP",
        rawJson: normalizeJsonValue(orderSeed.rawOrder) as Record<string, unknown>,
        contentHash: computeContentHash(orderSeed.rawOrder as unknown as Record<string, unknown>),
        createdAt: orderSeed.createdAt,
        updatedAt: orderSeed.createdAt,
      }

      await upsertOrder(db, customerId, orderPayload)

      const [savedOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.customerId, customerId), eq(orders.squareId, orderSeed.squareOrderId)))
        .limit(1)

      if (!savedOrder) {
        throw new Error(`Failed to seed order ${orderSeed.squareOrderId}`)
      }

      await deleteOrderLineItemsByOrderId(db, savedOrder.id)
      await bulkInsertOrderLineItems(
        db,
        orderSeed.lineItems.map((item) => ({ ...item, orderId: savedOrder.id })),
      )

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
        processingFeeMoney: 0n,
        cardBrand: orderSeed.cardBrand,
        cardLast4: orderSeed.tenderType === "CARD" ? String(randomInt(1000, 9999)) : null,
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

      aggregates.push({
        squareLocationId: location.squareId,
        createdAt: orderSeed.createdAt.toISOString(),
        totalMoney: orderSeed.totalMoney,
        totalTaxMoney: orderSeed.totalTaxMoney,
        totalDiscountMoney: orderSeed.orderDiscountMoney,
        totalTipMoney: orderSeed.totalTipMoney,
        totalServiceChargeMoney: orderSeed.totalServiceChargeMoney,
      })
    }
  }

  return aggregates
}

const seedDailySales = async (
  db: ReturnType<typeof getDbClient>["db"],
  customerId: string,
  seededLocations: SeededLocation[],
  orderAggregates: SeededOrderAggregate[],
): Promise<number> => {
  const payloads = new Map<string, Required<DailySalesPayload>>()
  const locationMap = new Map(seededLocations.map((location) => [location.squareId, location.id]))

  for (const aggregate of orderAggregates) {
    const locationId = locationMap.get(aggregate.squareLocationId)
    if (!locationId) continue

    const saleDate = aggregate.createdAt.slice(0, 10)
    const key = `${locationId}|${saleDate}`
    const grossSales = aggregate.totalMoney - aggregate.totalTaxMoney - aggregate.totalTipMoney
    const existing = payloads.get(key)

    if (existing) {
      existing.grossSales += grossSales
      existing.totalDiscounts += aggregate.totalDiscountMoney
      existing.netSales += grossSales - aggregate.totalDiscountMoney
      existing.totalTax += aggregate.totalTaxMoney
      existing.totalTips += aggregate.totalTipMoney
      existing.totalServiceCharges += aggregate.totalServiceChargeMoney
      existing.totalCollected += aggregate.totalMoney
      existing.storeGrossSales += grossSales
      existing.orderCount += 1
      continue
    }

    payloads.set(key, {
      locationId,
      saleDate,
      grossSales,
      totalDiscounts: aggregate.totalDiscountMoney,
      totalReturns: 0n,
      netSales: grossSales - aggregate.totalDiscountMoney,
      totalTax: aggregate.totalTaxMoney,
      totalTips: aggregate.totalTipMoney,
      totalServiceCharges: aggregate.totalServiceChargeMoney,
      totalCollected: aggregate.totalMoney,
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

    const seededLocations = await seedLocations(db, customerId)
    console.log(`  Seeded ${seededLocations.length} locations`)

    const orderAggregates = await seedOrdersForLocations(db, customerId, seededLocations)
    console.log(`  Seeded ${orderAggregates.length} orders and payments`)

    const dailyRowCount = await seedDailySales(db, customerId, seededLocations, orderAggregates)
    console.log(`  Upserted ${dailyRowCount} daily_sales rows`)

    console.log("DB square seed complete.")
  } catch (error) {
    console.error("DB square seed failed:", error)
    process.exit(1)
  } finally {
    await queryClient.end()
  }
}

void seedSquareData()
