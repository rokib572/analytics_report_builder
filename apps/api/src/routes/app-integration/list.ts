import { Hono } from "hono"
import { listAppIntegrations as listAppIntegrationsDB } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const listAppIntegrations = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")

  const listAppIntegrationData = await listAppIntegrationsDB(db, { customerId })

  return context.json({ success: true, data: listAppIntegrationData })
})

export default listAppIntegrations
