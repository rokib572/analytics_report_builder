import { Hono } from "hono"
import { getAppIntegrationById } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const getRouter = new Hono<AuthEnv>().get("/", async (context) => {
  const customerId = context.get("customerId")
  const query = context.req.query()

  const appIntegrationData = await getAppIntegrationById(db, { customerId, id: query.id })

  return context.json({ success: true, data: appIntegrationData })
})

export default getRouter
