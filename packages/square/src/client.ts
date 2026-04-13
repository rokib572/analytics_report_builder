import { SquareClient, SquareEnvironment } from "square"
import {
  getAppIntegrationSecret,
  getDbClient,
  getOAuthTokens,
  updateOAuthTokens,
} from "@analytics/database"
import { DomainError } from "../../shared-libs/src"
import { refreshAccessToken } from "./oauth/token"

const SQUARE_APP_NAME = "square"
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

const resolveEnvironment = (environment: string) =>
  environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox

export const createSquareClient = async (customerId: string) => {
  const { db } = getDbClient(process.env.DATABASE_URL!, { logQueries: false })

  // Try OAuth tokens first
  const oauthIntegration = await getOAuthTokens(db, { customerId, appName: SQUARE_APP_NAME })
  if (oauthIntegration?.oauthAccessToken) {
    let token = oauthIntegration.oauthAccessToken

    // Auto-refresh if token is expired or near expiry
    if (
      oauthIntegration.oauthExpiresAt &&
      oauthIntegration.oauthRefreshToken &&
      oauthIntegration.oauthExpiresAt.getTime() - Date.now() < TOKEN_REFRESH_BUFFER_MS
    ) {
      try {
        const refreshed = await refreshAccessToken(
          oauthIntegration.oauthRefreshToken,
          oauthIntegration.environment,
        )
        await updateOAuthTokens(db, customerId, oauthIntegration.id, {
          oauthAccessToken: refreshed.accessToken,
          oauthRefreshToken: refreshed.refreshToken,
          oauthExpiresAt: refreshed.expiresAt,
        })
        token = refreshed.accessToken
      } catch (error) {
        console.error("[SquareTokenRefreshError]", {
          customerId,
          message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        })
      }
    }

    return new SquareClient({
      token,
      environment: resolveEnvironment(oauthIntegration.environment),
    })
  }

  // Fall back to legacy PAT
  const integration = await getAppIntegrationSecret(db, { customerId, appName: SQUARE_APP_NAME })

  if (!integration?.appSecret) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: "No active Square integration found for this customer",
      clientSafeMessage:
        "No active Square integration found. Please connect your Square account to view locations.",
    })
  }

  return new SquareClient({
    token: integration.appSecret,
    environment: resolveEnvironment(integration.environment),
  })
}

export const createSquareClientWithToken = ({
  appSecret,
  environment,
}: {
  appSecret: string
  environment: string
}) =>
  new SquareClient({
    token: appSecret,
    environment: resolveEnvironment(environment),
  })
