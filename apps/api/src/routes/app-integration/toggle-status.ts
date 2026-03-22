import { Hono } from "hono"
import { validator } from "hono/validator"
import { toggleAppIntegrationStatus } from "@analytics/database"
import { IdParamSchema } from "@analytics/validators"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const toggleStatus = new Hono<AuthEnv>().patch(
  "/:id",
  validator("param", (input) => IdParamSchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const id = context.req.valid("param").id

    const appIntegrationData = await toggleAppIntegrationStatus(db, {
      customerId,
      appIntegrationId: id,
    })

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default toggleStatus
