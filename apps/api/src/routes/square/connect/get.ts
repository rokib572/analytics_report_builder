import { Hono } from "hono"
import { getAppIntegrationByAppName } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const getRouter = new Hono<AuthEnv>().get("/square", async (context) => {
  const customerId = context.get("customerId")

  const integration = await getAppIntegrationByAppName(db, { customerId, appName: SQUARE_APP_NAME })

  if (!integration) {
    return context.json({ connected: false })
  }

  return context.json({
    connected: true,
    integration: {
      id: integration.id,
      appName: integration.appName,
      environment: integration.environment,
      isActive: integration.isActive,
      label: integration.label,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    },
  })
})

export default getRouter
