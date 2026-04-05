import { Hono } from "hono"
import { validator } from "hono/validator"
import {
  aggregateOrdersToDaily,
  syncLocations,
  syncCustomers,
  syncInventory,
  syncOrders,
  syncPayments,
  syncRefunds,
  syncCatalog,
} from "@analytics/data-sync"
import { getLocationSquareIdMap, upsertDailySales } from "@analytics/database"
import { batchSearchOrders } from "@analytics/square"
import { SyncRequestSchema } from "@analytics/validators"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
import { requireRole } from "../../../middleware/require-role"

const toRfc3339Range = (startAt: string, endAt: string) => ({
  startAt: `${startAt}T00:00:00.000Z`,
  endAt: `${endAt}T23:59:59.999Z`,
})

const router = new Hono<AuthEnv>().post(
  "/",
  requireRole("system_admin"),
  validator("json", (input) => SyncRequestSchema.parse(input)),
  async (context) => {
    const data = context.req.valid("json")
    const customerId = context.get("customerId")

    if (data.type === "locations") {
      const result = await syncLocations(db, customerId)
      return context.json({ success: true, ...result })
    } else if (data.type === "customers") {
      const result = await syncCustomers(db, customerId)
      return context.json({ success: true, ...result })
    } else if (data.type === "orders") {
      const syncRange = toRfc3339Range(data.startAt, data.endAt)
      const result = await syncOrders(db, customerId, syncRange.startAt, syncRange.endAt)
      const paymentResult = await syncPayments(db, customerId, syncRange.startAt, syncRange.endAt)
      const refundResult = await syncRefunds(db, customerId, syncRange.startAt, syncRange.endAt)
      const inventoryResult = await syncInventory(
        db,
        customerId,
        syncRange.startAt,
        syncRange.endAt,
      )
      let aggregated = 0

      if (result.synced > 0) {
        const locationMap = await getLocationSquareIdMap(db, customerId)
        const squareLocationIds = [...locationMap.keys()]

        if (squareLocationIds.length > 0) {
          const orders = await batchSearchOrders(
            customerId,
            squareLocationIds,
            syncRange.startAt,
            syncRange.endAt,
          )
          const dailyPayloads = aggregateOrdersToDaily(orders, locationMap, "manual")

          for (const payload of dailyPayloads) {
            await upsertDailySales(db, customerId, payload)
          }

          aggregated = dailyPayloads.length
        }
      }

      return context.json({
        success: true,
        ...result,
        payments: paymentResult,
        refunds: refundResult,
        inventory: inventoryResult,
        aggregated,
      })
    } else if (data.type === "catalog") {
      const result = await syncCatalog(db, customerId)
      return context.json({ success: true, ...result })
    }

    return context.json({ success: false, message: "Unknown sync type" }, 400)
  },
)

export default router
