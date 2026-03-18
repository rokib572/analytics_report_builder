import { Hono } from "hono"
import { listAppIntegrations } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const listRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")

  const listAppIntegrationData = await listAppIntegrations(db, { customerId })

  return context.json({ success: true, data: listAppIntegrationData })
})

export default listRouter
