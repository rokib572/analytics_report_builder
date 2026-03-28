import { Hono } from "hono"
import { validator } from "hono/validator"
import { syncLocations, syncCustomers, syncOrders } from "@analytics/data-sync"
import { SyncRequestSchema } from "@analytics/validators"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
import { requireRole } from "../../../middleware/require-role"

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
      const result = await syncOrders(db, customerId, data.startAt, data.endAt)
      return context.json({ success: true, ...result })
    }

    return context.json({ success: false, message: "Unknown sync type" }, 400)
  },
)

export default router
