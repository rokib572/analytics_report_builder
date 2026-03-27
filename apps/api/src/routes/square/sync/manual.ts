import { Hono } from "hono"
import { validator } from "hono/validator"
import { z } from "zod"
import { syncLocations, syncCustomers } from "@analytics/data-sync"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
import { requireRole } from "../../../middleware/require-role"

const SyncRequestSchema = z.object({
  type: z.enum(["locations", "customers"]),
})

const router = new Hono<AuthEnv>().post(
  "/",
  requireRole("system_admin"),
  validator("json", (input) => SyncRequestSchema.parse(input)),
  async (context) => {
    const { type } = context.req.valid("json")
    const customerId = context.get("customerId")

    if (type === "locations") {
      const result = await syncLocations(db, customerId)
      return context.json({ success: true, ...result })
    } else if (type === "customers") {
      const result = await syncCustomers(db, customerId)
      return context.json({ success: true, ...result })
    }

    return context.json({ success: false, message: "Unknown sync type" }, 400)
  },
)

export default router
