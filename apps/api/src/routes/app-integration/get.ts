import { Hono } from "hono"
import z from "zod"
import { getAppIntegrationById as getAppIntegrationByIdDB } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { schemaValidator } from "../../middleware/schema-validator"

const idParamSchema = z.object({
  id: z.string().length(26, { error: "Invalid ID: must be a 26-character ULID" }),
})

const getAppIntegrationById = new Hono<AuthEnv>().get(
  "/:id",
  schemaValidator("param", idParamSchema),
  async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.valid("param").id

    const appIntegrationData = await getAppIntegrationByIdDB(db, { customerId, id })

    if (!appIntegrationData) {
      return context.json({ error: "App integration not found" }, 404)
    }

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default getAppIntegrationById
