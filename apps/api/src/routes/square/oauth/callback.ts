import { Hono } from "hono"
import {
  consumeOAuthState,
  createAppIntegration,
  createSyncLog,
  findRunningBackfill,
  getAppIntegrationByAppName,
  updateOAuthTokens,
  updateWebhookSubscription,
} from "@analytics/database"
import { exchangeCodeForToken, createWebhookSubscription } from "@analytics/square"
import { getBackfillDateRange, runBackfill, syncLocations } from "@analytics/data-sync"
import { db } from "../../../lib/db"

const SQUARE_APP_NAME = "square"

const callbackRouter = new Hono().get("/", async (context) => {
  const code = context.req.query("code")
  const state = context.req.query("state")
  const uiBaseUrl = process.env.UI_BASE_URL ?? "http://localhost:5173"

  if (!code || !state) {
    return context.redirect(`${uiBaseUrl}/connect?error=Missing+authorization+code+or+state`)
  }

  let oauthState
  try {
    oauthState = await consumeOAuthState(db, state)
  } catch {
    return context.redirect(`${uiBaseUrl}/connect?error=Invalid+or+expired+OAuth+request`)
  }

  const { customerId, environment, backfillScope } = oauthState

  let tokens
  try {
    tokens = await exchangeCodeForToken(code, environment)
  } catch {
    return context.redirect(`${uiBaseUrl}/connect?error=Failed+to+exchange+authorization+code`)
  }

  // Create or update integration
  let integrationId: string
  const existing = await getAppIntegrationByAppName(
    db,
    { customerId, appName: SQUARE_APP_NAME },
    { includeDisabled: true },
  )

  if (existing) {
    await updateOAuthTokens(db, customerId, existing.id, {
      oauthAccessToken: tokens.accessToken,
      oauthRefreshToken: tokens.refreshToken,
      oauthExpiresAt: tokens.expiresAt,
      merchantId: tokens.merchantId,
      scopes: tokens.scopes,
      reactivate: true,
    })
    integrationId = existing.id
  } else {
    const integration = await createAppIntegration(db, customerId, {
      appName: SQUARE_APP_NAME,
      appSecret: null,
      environment,
      label: "Square POS",
    })
    await updateOAuthTokens(db, customerId, integration.id, {
      oauthAccessToken: tokens.accessToken,
      oauthRefreshToken: tokens.refreshToken,
      oauthExpiresAt: tokens.expiresAt,
      merchantId: tokens.merchantId,
      scopes: tokens.scopes,
    })
    integrationId = integration.id
  }

  // Create webhook subscription
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL!
  try {
    const subscription = await createWebhookSubscription(environment, notificationUrl)
    await updateWebhookSubscription(db, customerId, integrationId, {
      webhookSubscriptionId: subscription.subscriptionId,
      webhookSignatureKey: subscription.signatureKey,
    })
  } catch (error) {
    console.error("[WebhookSubscriptionError]", {
      customerId,
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })
  }

  // Sync locations
  try {
    await syncLocations(db, customerId)
  } catch (error) {
    console.error("[LocationSyncError]", {
      customerId,
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })
  }

  // Start backfill if none running
  const runningBackfill = await findRunningBackfill(db, customerId)
  if (!runningBackfill) {
    try {
      const backfillRange = getBackfillDateRange(
        backfillScope as "30d" | "3m" | "6m" | "12m" | "24m" | "all",
      )
      const backfillLog = await createSyncLog(db, {
        customerId,
        syncType: "backfill",
        locationId: null,
        dateFrom: backfillRange.startAt,
        dateTo: backfillRange.endAt,
        squareCount: null,
        dbCount: null,
        discrepancy: null,
        ordersFetched: 0,
        status: "pending",
        errorMessage: null,
      })

      void runBackfill(db, customerId, backfillLog.id).catch((error) => {
        console.error("[BackfillStartError]", error)
      })
    } catch (error) {
      console.error("[BackfillSetupError]", {
        customerId,
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      })
    }
  }

  return context.redirect(`${uiBaseUrl}/integrations?connected=square`)
})

export default callbackRouter
