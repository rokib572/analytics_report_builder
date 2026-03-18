import { Hono } from "hono"
import { toggleAppIntegrationStatus, getAppIntegrationByAppName } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const deleteRouter = new Hono<AuthEnv>().delete("/square", async (context) => {
  const customerId = context.get("customerId")

  const integration = await getAppIntegrationByAppName(db, { customerId, appName: SQUARE_APP_NAME })

  if (!integration) {
    return context.json({ error: "No Square integration found" }, 404)
  }

  await toggleAppIntegrationStatus(db, { customerId, appIntegrationId: integration.id })

  return context.json({ success: true })
})

export default deleteRouter
