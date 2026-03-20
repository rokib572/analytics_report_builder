import { Hono } from "hono"
import z from "zod"
import { toggleAppIntegrationStatus } from "@analytics/database"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { schemaValidator } from "../../middleware/schema-validator"

const idParamSchema = z.object({
  id: z.string().length(26, { error: "Invalid ID: must be a 26-character ULID" }),
})

const toggleStatus = new Hono<AuthEnv>().patch(
  "/:id",
  schemaValidator("param", idParamSchema),
  async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.valid("param").id

    const appIntegrationData = await toggleAppIntegrationStatus(db, {
      customerId,
      appIntegrationId: id,
    })

    if (!appIntegrationData) {
      return context.json({ error: "App integration not found" }, 404)
    }

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default toggleStatus
