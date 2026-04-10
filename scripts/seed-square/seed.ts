import { type Square, SquareClient, SquareEnvironment } from "square"
import { CATALOG_ITEMS, CUSTOMERS, INVENTORY_CONFIG, ORDER_CONFIG } from "./config"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------
// Step 1: List locations
// ---------------------------------------------------------------------------

const listLocations = async (client: SquareClient) => {
  const response = await client.locations.list()
  const locations = response.locations ?? []
  if (locations.length === 0) throw new Error("No locations found in Square sandbox account")
  return locations
}

// ---------------------------------------------------------------------------
// Step 2: Create catalog items
// ---------------------------------------------------------------------------

type VariationMapping = {
  variationId: string
  itemName: string
  variationName: string
  price: number
}

const createCatalogItems = async (client: SquareClient): Promise<VariationMapping[]> => {
  const objects: Square.CatalogObject[] = CATALOG_ITEMS.map((item, i) => ({
    type: "ITEM" as const,
    id: `#seed-item-${i}`,
    itemData: {
      name: item.name,
      variations: item.variations.map((v, j) => ({
        type: "ITEM_VARIATION" as const,
        id: `#seed-item-${i}-var-${j}`,
        itemVariationData: {
          name: v.name,
          pricingType: "FIXED_PRICING" as const,
          priceMoney: { amount: BigInt(v.price), currency: "USD" as const },
        },
      })),
    },
  }))

  const response = await client.catalog.batchUpsert({
    idempotencyKey: crypto.randomUUID(),
    batches: [{ objects }],
  })

  const mappings = response.idMappings ?? []
  const variationMappings: VariationMapping[] = []

  for (const item of CATALOG_ITEMS) {
    for (const variation of item.variations) {
      const itemIdx = CATALOG_ITEMS.indexOf(item)
      const varIdx = item.variations.indexOf(variation)
      const tempId = `#seed-item-${itemIdx}-var-${varIdx}`
      const mapping = mappings.find((m: Square.CatalogIdMapping) => m.clientObjectId === tempId)
      if (mapping?.objectId) {
        variationMappings.push({
          variationId: mapping.objectId,
          itemName: item.name,
          variationName: variation.name,
          price: variation.price,
        })
      }
    }
  }

  return variationMappings
}

// ---------------------------------------------------------------------------
// Step 2b: Seed inventory counts
// ---------------------------------------------------------------------------

const seedInventory = async (
  client: SquareClient,
  locationId: string,
  variations: VariationMapping[],
): Promise<number> => {
  const occurredAt = new Date().toISOString()
  const changes: Square.InventoryChange[] = variations.map((variation) => ({
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
  }))

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
// Step 3: Create customers
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
// Step 4: Create orders with payments
// ---------------------------------------------------------------------------

const createOrders = async (
  client: SquareClient,
  locationId: string,
  variations: VariationMapping[],
  customers: CreatedCustomer[],
) => {
  const days = getDateRange(ORDER_CONFIG.dateRangeFrom, ORDER_CONFIG.dateRangeTo)
  let totalOrders = 0

  for (const day of days) {
    const orderCount = randomInt(ORDER_CONFIG.ordersPerDay.min, ORDER_CONFIG.ordersPerDay.max)

    for (let i = 0; i < orderCount; i++) {
      const lineItemCount = randomInt(
        ORDER_CONFIG.lineItemsPerOrder.min,
        ORDER_CONFIG.lineItemsPerOrder.max,
      )

      const lineItems: Square.OrderLineItem[] = Array.from({ length: lineItemCount }, () => {
        const variation = pickRandom(variations)
        const quantity = randomInt(1, 3)
        return {
          catalogObjectId: variation.variationId,
          quantity: String(quantity),
        }
      })

      const customer =
        Math.random() < ORDER_CONFIG.customerProbability ? pickRandom(customers) : undefined

      // Create the order (defaults to OPEN state, required for payment)
      const orderResponse = await client.orders.create({
        order: {
          locationId,
          customerId: customer?.id,
          lineItems,
        },
        idempotencyKey: crypto.randomUUID(),
      })

      const order = orderResponse.order
      if (!order?.id || !order.totalMoney?.amount) continue

      // Create a payment to complete the order
      const tenderType = pickRandom(ORDER_CONFIG.tenderTypes)

      if (tenderType === "CARD") {
        await client.payments.create({
          sourceId: "cnon:card-nonce-ok",
          idempotencyKey: crypto.randomUUID(),
          amountMoney: {
            amount: order.totalMoney.amount,
            currency: "USD",
          },
          orderId: order.id,
          locationId,
          customerId: customer?.id,
          tipMoney:
            Math.random() > 0.5
              ? { amount: BigInt(randomInt(100, 500)), currency: "USD" as const }
              : undefined,
        })
      } else {
        await client.payments.create({
          sourceId: "CASH",
          idempotencyKey: crypto.randomUUID(),
          amountMoney: {
            amount: order.totalMoney.amount,
            currency: "USD",
          },
          orderId: order.id,
          locationId,
          customerId: customer?.id,
          cashDetails: {
            buyerSuppliedMoney: {
              amount: order.totalMoney.amount,
              currency: "USD",
            },
          },
        })
      }

      totalOrders++
    }

    console.log(`  ${day}: ${orderCount} orders created (total: ${totalOrders})`)
    await delay(200)
  }

  return totalOrders
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const token = process.env.SQUARE_ACCESS_TOKEN
  if (!token) {
    console.error("Error: SQUARE_ACCESS_TOKEN environment variable is required")
    process.exit(1)
  }

  const client = new SquareClient({
    token,
    environment: SquareEnvironment.Sandbox,
  })

  console.log("Seeding Square sandbox data...\n")

  // 1. Get location
  const locations = await listLocations(client)
  const location = locations[0]!
  console.log(`Using location: ${location.name} (${location.id})\n`)

  // 2. Create catalog items
  const variationCount = CATALOG_ITEMS.reduce((sum, item) => sum + item.variations.length, 0)
  console.log(`Creating ${CATALOG_ITEMS.length} catalog items with ${variationCount} variations...`)
  const variations = await createCatalogItems(client)
  console.log(`  Created ${variations.length} variations\n`)

  // 2b. Seed inventory counts
  console.log(`Seeding inventory for ${variations.length} variations at ${location.name}...`)
  const stockedCount = await seedInventory(client, location.id!, variations)
  console.log(`  Applied ${stockedCount} PHYSICAL_COUNT changes\n`)

  // 3. Create customers
  console.log(`Creating ${CUSTOMERS.length} customers...`)
  const customers = await createCustomers(client)
  console.log(`  Created ${customers.length} customers\n`)

  // 4. Create orders
  console.log(
    `Creating orders from ${ORDER_CONFIG.dateRangeFrom} to ${ORDER_CONFIG.dateRangeTo}...`,
  )
  const totalOrders = await createOrders(client, location.id!, variations, customers)
  console.log(`\nSeeding complete! Created ${totalOrders} orders.`)
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
