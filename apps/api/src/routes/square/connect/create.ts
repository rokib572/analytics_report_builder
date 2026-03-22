import { Hono } from "hono"
import { validator } from "hono/validator"
import { createAppIntegration } from "@analytics/database"
import { DomainError } from "@analytics/shared-libs"
import { ConnectSquareSchema } from "@analytics/validators"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
import { validateTokenStatus } from "./create.validate-token-status"
const SQUARE_APP_NAME = "square"

const createSquareConnectionRouter = new Hono<AuthEnv>().post(
  "/",
  validator("json", (input) => ConnectSquareSchema.parse(input)),
  async (context) => {
    // accessKye is optional and to be used only for apps requiring both appId and secretKey (like Facebook Conversions API).
    // For Square, we can ignore it but still keep it optional in case we want to use it in the future for other integrations.
    const { accessToken, environment, accessKey } = context.req.valid("json")
    const customerId = context.get("customerId")

    // Verify the token has required permissions and can connect to Square API
    await validateTokenStatus({ accessToken, environment, customerId })

    // Store integration
    const integration = await createAppIntegration(db, customerId, {
      appName: SQUARE_APP_NAME,
      appKey: accessKey,
      appSecret: accessToken,
      environment,
      label: "Square POS",
    })

    if (!integration) {
      throw DomainError.makeError({
        code: "INTERNAL_ERROR",
        message: "Failed to save Square integration to the database.",
        clientSafeMessage: "Failed to save integration. Please try again later.",
        additionalContext: { customerId },
      })
    }

    return context.json({ success: true, integration })
  },
)

export default createSquareConnectionRouter
