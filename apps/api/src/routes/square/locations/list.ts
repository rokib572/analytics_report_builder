import { Hono } from "hono"
import { getAppIntegrationByAppName } from "@analytics/database"
import { createSquareClient } from "@analytics/square"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const listSquareLocationRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")

  const integration = await getAppIntegrationByAppName(db, { customerId, appName: SQUARE_APP_NAME })

  if (!integration) {
    return context.json({ success: false })
  }

  const squareClient = createSquareClient(integration.appSecret, integration.environment)
  const locationResponse = await squareClient.locations.list()

  if (!locationResponse || !locationResponse.locations) {
    return context.json({ success: false })
  }
  return context.json({
    success: true,
    locations: locationResponse.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      timezone: loc.timezone,
      status: loc.status,
      country: loc.country,
      currency: loc.currency,
      business_name: loc.businessName,
      type: loc.type,
    })),
  })
})

export default listSquareLocationRouter
