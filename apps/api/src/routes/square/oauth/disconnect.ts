import { Hono } from "hono"
import {
  deactivateIntegration,
  getAppIntegrationByAppName,
  getOAuthTokens,
} from "@analytics/database"
import { deleteWebhookSubscription, revokeToken } from "@analytics/square"
import { DomainError } from "@analytics/shared-libs"
import { db } from "../../../lib/db"
import type { AuthEnv } from "../../../middleware/auth"

const SQUARE_APP_NAME = "square"

const disconnectRouter = new Hono<AuthEnv>().post("/", async (context) => {
  const customerId = context.get("customerId")

  const integration = await getAppIntegrationByAppName(db, {
    customerId,
    appName: SQUARE_APP_NAME,
  })

  if (!integration) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: "No active Square integration found",
      clientSafeMessage: "No active Square integration found to disconnect.",
    })
  }

  const oauthTokens = await getOAuthTokens(db, { customerId, appName: SQUARE_APP_NAME })

  // Delete webhook subscription first (needs valid token)
  if (integration.webhookSubscriptionId) {
    try {
      await deleteWebhookSubscription(
        oauthTokens?.environment ?? integration.environment,
        integration.webhookSubscriptionId,
      )
    } catch (error) {
      console.error("[WebhookSubscriptionDeleteError]", {
        customerId,
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      })
    }
  }

  // Revoke OAuth token
  if (oauthTokens?.oauthAccessToken) {
    try {
      await revokeToken(oauthTokens.oauthAccessToken, oauthTokens.environment)
    } catch (error) {
      console.error("[OAuthTokenRevokeError]", {
        customerId,
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      })
    }
  }

  // Deactivate integration and clear sensitive fields
  await deactivateIntegration(db, customerId, integration.id)

  return context.json({ success: true })
})

export default disconnectRouter
