import { Hono } from "hono"
import { validator } from "hono/validator"
import { getAppIntegrationById as getAppIntegrationByIdDB } from "@analytics/database"
import { IdParamSchema } from "@analytics/validators"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"
import { DomainError } from "@analytics/shared-libs"

const getAppIntegrationById = new Hono<AuthEnv>().get(
  "/:id",
  validator("param", (input) => IdParamSchema.parse(input)),
  async (context) => {
    const customerId = context.get("customerId")
    const appIntegrationId = context.req.valid("param").id

    const appIntegrationData = await getAppIntegrationByIdDB(db, { customerId, appIntegrationId })
    if (!appIntegrationData) {
      throw DomainError.makeError({
        code: "NOT_FOUND",
        message: `App integration with ID ${appIntegrationId} not found for customer ${customerId}`,
        clientSafeMessage: "App integration not found.",
        additionalContext: { customerId, appIntegrationId },
      })
    }

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default getAppIntegrationById
