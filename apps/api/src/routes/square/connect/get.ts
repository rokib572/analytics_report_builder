import { Hono } from "hono"
import { getAppIntegrationByAppName } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const getSquareConnectionRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")

  const integrationList = await getAppIntegrationByAppName(db, {
    customerId,
    appName: SQUARE_APP_NAME,
  })

  if (!integrationList) {
    return context.json({ success: false })
  }

  return context.json({
    success: true,
    integration: integrationList.map((i) => ({
      id: i.id,
      appName: i.appName,
      environment: i.environment,
      isActive: i.isActive,
      label: i.label,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
  })
})

export default getSquareConnectionRouter
