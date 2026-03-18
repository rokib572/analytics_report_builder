import { Hono } from "hono"
import { toggleAppIntegrationStatus } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const toggleStatus = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")
  const query = context.req.query()

  const appIntegrationData = await toggleAppIntegrationStatus(db, {
    customerId,
    appIntegrationId: query.id,
  })

  return context.json({ success: true, data: appIntegrationData })
})

export default toggleStatus
