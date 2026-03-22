import { Hono } from "hono"
import { getAppIntegrationByAppName } from "@analytics/database"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const listSquareConnectionRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")

  const integrationList = await getAppIntegrationByAppName(db, {
    customerId,
    appName: SQUARE_APP_NAME,
  })

  return context.json({
    success: true,
    integration: integrationList,
  })
})

export default listSquareConnectionRouter
