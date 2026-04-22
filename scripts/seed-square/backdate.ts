import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { config as loadDotenv } from "dotenv"
import type { Square } from "square"
import { getDbClient, getLocationSquareIdMap, upsertDailySales } from "@analytics/database"
import { aggregateOrdersToDaily } from "@analytics/data-sync"
import { SEED_OUTPUT_FILE, type SeedOutput } from "./config"

loadDotenv({ path: resolve(import.meta.dirname, "../../.env") })

type CliArgs = {
  customerId: string
  seedOutput: string
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2)
  let customerId: string | undefined
  let seedOutput = resolve(import.meta.dirname, SEED_OUTPUT_FILE)

  for (const arg of args) {
    if (arg.startsWith("--customer-id=")) customerId = arg.slice("--customer-id=".length)
    else if (arg.startsWith("--seed-output=")) seedOutput = arg.slice("--seed-output=".length)
  }

  if (!customerId) {
    console.error("Error: --customer-id=<id> is required")
    console.error("Usage: pnpm backdate --customer-id=<id> [--seed-output=<path>]")
    process.exit(1)
  }

  return { customerId, seedOutput }
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randomTimestampOnDate = (dateStr: string): Date => {
  const hour = randomInt(7, 21)
  const minute = randomInt(0, 59)
  const second = randomInt(0, 59)
  const ms = randomInt(0, 999)
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!, hour, minute, second, ms))
}

const datesInRange = (from: string, to: string): string[] => {
  const dates: string[] = []
  const current = new Date(from + "T00:00:00Z")
  const end = new Date(to + "T00:00:00Z")
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

type BackdateOrderRow = {
  id: string
  locationId: string
  rawJson: unknown
  closedAt: string | Date | null
}

const main = async () => {
  const { customerId, seedOutput } = parseArgs()

  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL is required (put it in .env)")
    process.exit(1)
  }

  const seed: SeedOutput = JSON.parse(readFileSync(seedOutput, "utf-8"))
  console.log(
    `Loaded ${seed.squareOrderIds.length} order IDs from ${seedOutput} (range ${seed.dateRangeFrom} → ${seed.dateRangeTo})\n`,
  )

  if (seed.squareOrderIds.length === 0) {
    console.log("Nothing to backdate.")
    return
  }

  const { db, queryClient } = getDbClient(process.env.DATABASE_URL)

  try {
    const dbOrders = await queryClient<BackdateOrderRow[]>`
      select
        id,
        location_id as "locationId",
        raw_json as "rawJson",
        closed_at as "closedAt"
      from core_data.orders
      where customer_id = ${customerId}
        and square_id in ${queryClient(seed.squareOrderIds)}
    `

    const missing = seed.squareOrderIds.length - dbOrders.length
    if (missing > 0) {
      console.warn(
        `Warning: ${missing} order(s) from seed-output.json are not in the DB yet. Trigger a Square sync first, then re-run.`,
      )
    }
    if (dbOrders.length === 0) {
      console.log("No matching orders in DB. Aborting.")
      return
    }

    const candidateDates = datesInRange(seed.dateRangeFrom, seed.dateRangeTo)
    const today = new Date().toISOString().slice(0, 10)
    const affectedLocationIds = new Set<string>()
    const perOrderAssignments = new Map<string, { newDate: string; newCreatedAt: Date }>()

    console.log(`Backdating ${dbOrders.length} orders across ${candidateDates.length} days...`)
    for (const order of dbOrders) {
      const newDate = candidateDates[randomInt(0, candidateDates.length - 1)]!
      const newCreatedAt = randomTimestampOnDate(newDate)
      const rawOrder =
        order.rawJson && typeof order.rawJson === "object"
          ? (order.rawJson as Record<string, unknown>)
          : {}

      perOrderAssignments.set(order.id, { newDate, newCreatedAt })
      affectedLocationIds.add(order.locationId)

      const updatedRawOrder = {
        ...rawOrder,
        createdAt: newCreatedAt.toISOString(),
        updatedAt: newCreatedAt.toISOString(),
        ...(order.closedAt ? { closedAt: newCreatedAt.toISOString() } : { closedAt: null }),
      }

      await queryClient`
        update core_data.orders
        set
          sale_date = ${newDate},
          created_at = ${newCreatedAt},
          updated_at = ${newCreatedAt},
          closed_at = ${order.closedAt ? newCreatedAt : null},
          raw_json = ${JSON.stringify(updatedRawOrder)}::jsonb
        where customer_id = ${customerId}
          and id = ${order.id}
      `

      await queryClient`
        update core_data.order_line_items
        set sale_date = ${newDate}
        where order_id = ${order.id}
      `

      await queryClient`
        update core_data.payments
        set
          created_at = ${newCreatedAt},
          updated_at = ${newCreatedAt}
        where customer_id = ${customerId}
          and order_id = ${order.id}
      `
    }
    console.log(`  Updated ${perOrderAssignments.size} orders (+ line items + payments).\n`)

    console.log(`Clearing stale daily_sales rows for ${today} (orders moved off today)...`)
    if (affectedLocationIds.size > 0) {
      await queryClient`
        delete from core_data.daily_sales
        where location_id in ${queryClient([...affectedLocationIds])}
          and sale_date = ${today}
      `
    }

    console.log(`Re-aggregating daily_sales from backdated orders...`)
    const locationMap = await getLocationSquareIdMap(db, customerId)

    const reconstructed: Square.Order[] = []
    for (const order of dbOrders) {
      const assignment = perOrderAssignments.get(order.id)
      if (!assignment) continue
      if (!order.rawJson || typeof order.rawJson !== "object") continue
      const raw = order.rawJson as Square.Order
      reconstructed.push({
        ...raw,
        createdAt: assignment.newCreatedAt.toISOString(),
        updatedAt: assignment.newCreatedAt.toISOString(),
        closedAt: order.closedAt ? assignment.newCreatedAt.toISOString() : undefined,
      })
    }

    const dailyPayloads = aggregateOrdersToDaily(reconstructed, locationMap, "seed-backdate")
    for (const payload of dailyPayloads) {
      await upsertDailySales(db, customerId, payload)
    }
    console.log(`  Upserted ${dailyPayloads.length} daily_sales rows.`)

    console.log(`\nBackdate complete.`)
    console.log(`  Affected locations: ${affectedLocationIds.size}`)
    console.log(`  Orders backdated:   ${perOrderAssignments.size}`)
    console.log(`  Daily rows written: ${dailyPayloads.length}`)
  } finally {
    await queryClient.end()
  }
}

main().catch((error) => {
  console.error("Backdate failed:", error)
  process.exit(1)
})
