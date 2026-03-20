import { Hono } from "hono"
import { schemaValidator } from "../../../middleware/schema-validator"
import { ConnectSquareSchema } from "@analytics/validators"
import { createAppIntegration } from "@analytics/database"
import { createSquareClient, retrieveAccessTokenStatus } from "@analytics/square"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"
const SQUARE_APP_NAME = "square"

const createSquareConnectionRouter = new Hono<AuthEnv>().post(
  "/",
  schemaValidator("json", ConnectSquareSchema),
  async (context) => {
    // accessKye is optional and to be used only for apps requiring both appId and secretKey (like Facebook Conversions API).
    // For Square, we can ignore it but still keep it optional in case we want to use it in the future for other integrations.
    const { accessToken, environment, accessKey } = context.req.valid("json")
    const customerId = context.get("customerId")

    // Verify the token works by fetching locations from Square
    const squareClient = createSquareClient(accessToken, environment)
    try {
      const accessTokenStatus = await retrieveAccessTokenStatus(squareClient)
      if (!accessTokenStatus || !accessTokenStatus.clientId) {
        return context.json(
          { error: "Invalid Square access token. Could not connect to Square API." },
          400,
        )
      }

      const scopes = accessTokenStatus.scopes || []
      if (
        !scopes.includes("MERCHANT_PROFILE_READ") &&
        !scopes.includes("ORDERS_READ") &&
        !scopes.includes("PAYMENTS_READ")
      ) {
        return context.json(
          {
            error:
              "Insufficient permissions for the provided Square access token. Please ensure it has the MERCHANT_PROFILE_READ, ORDERS_READ and PAYMENTS_READ scope.",
          },
          400,
        )
      }
    } catch {
      return context.json(
        { error: "Invalid Square access token. Could not connect to Square API." },
        400,
      )
    }

    // Store (or update existing) integration
    const integration = await createAppIntegration(db, customerId, {
      appName: SQUARE_APP_NAME,
      appKey: accessKey,
      appSecret: accessToken,
      environment,
      label: "Square POS",
    })

    if (!integration) {
      return context.json({ error: "Failed to save integration" }, 500)
    }

    return context.json({
      success: true,
      integration: {
        id: integration.id,
        appName: integration.appName,
        environment: integration.environment,
        isActive: integration.isActive,
        label: integration.label,
        createdAt: integration.createdAt,
      },
    })
  },
)

export default createSquareConnectionRouter
