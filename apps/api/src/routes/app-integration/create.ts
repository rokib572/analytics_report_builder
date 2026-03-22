import { Hono } from "hono"
import { validator } from "hono/validator"
import { createAppIntegration as createAppIntegrationDB } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import { CreateAppIntegrationSchema } from "@analytics/validators"
import { db } from "../../lib/db"
import type { AuthEnv } from "../../middleware/auth"

const createAppIntegration = new Hono<AuthEnv>().post(
  "/",
  validator("json", (input) => CreateAppIntegrationSchema.parse(input)),
  async (context) => {
    const data = context.req.valid("json")
    const customerId = context.get("customerId")

    const appIntegrationData = await createAppIntegrationDB(db, customerId, data)

    if (!appIntegrationData) {
      throw DomainError.makeError({
        code: "INTERNAL_ERROR",
        message: `Failed to create app integration for customer ${customerId}`,
        clientSafeMessage: "Failed to create app integration. Please try again.",
        additionalContext: { customerId, appName: data.appName },
      })
    }

    return context.json({ success: true, data: appIntegrationData })
  },
)

export default createAppIntegration
