import { Hono } from "hono"
import { createAppIntegration } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { schema } from "./input.schema"
import { schemaValidator } from "../../middleware/schema-validator"

const createRouter = new Hono<AuthEnv>().post(
  "/",
  schemaValidator("json", schema),
  async (context) => {
    const data = context.req.valid("json")
    const customerId = context.get("customerId")

    const appIntegrationData = await createAppIntegration(db, customerId, data)

    if (!appIntegrationData) {
      return context.json({ error: "Something went wrong" }, 404)
    }

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default createRouter
