import { SquareClient, SquareEnvironment } from "square"

const SQUARE_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "ORDERS_READ",
  "ORDERS_WRITE",
  "PAYMENTS_READ",
  "PAYMENTS_WRITE",
  "ITEMS_READ",
  "INVENTORY_READ",
  "CUSTOMERS_READ",
  "DEVELOPER_APPLICATION_WEBHOOKS_WRITE",
]

const getBaseUrl = (environment: string) =>
  environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com"

export const getSquareEnvironment = () => {
  const env = process.env.SQUARE_ENVIRONMENT ?? "sandbox"
  return env === "production" ? "production" : "sandbox"
}

const getSquareOAuthConfig = (environment: string) => {
  const isProduction = environment === "production"
  return {
    clientId: process.env.SQUARE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.SQUARE_OAUTH_CLIENT_SECRET!,
    environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  }
}

export const buildAuthorizeUrl = (state: string, environment: string) => {
  const { clientId } = getSquareOAuthConfig(environment)
  const baseUrl = getBaseUrl(environment)
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SQUARE_SCOPES.join(" "),
    state,
  })

  if (environment === "production") {
    params.set("session", "false")
  }

  return `${baseUrl}/oauth2/authorize?${params.toString()}`
}

export const exchangeCodeForToken = async (code: string, environment: string) => {
  const { clientId, clientSecret, environment: sqEnv } = getSquareOAuthConfig(environment)

  const client = new SquareClient({ environment: sqEnv })
  const response = await client.oAuth.obtainToken({
    clientId,
    clientSecret,
    code,
    grantType: "authorization_code",
  })

  return {
    accessToken: response.accessToken!,
    refreshToken: response.refreshToken!,
    expiresAt: new Date(response.expiresAt!),
    merchantId: response.merchantId!,
    scopes: SQUARE_SCOPES.join(","),
  }
}

export const refreshAccessToken = async (refreshToken: string, environment: string) => {
  const { clientId, clientSecret, environment: sqEnv } = getSquareOAuthConfig(environment)

  const client = new SquareClient({ environment: sqEnv })
  const response = await client.oAuth.obtainToken({
    clientId,
    clientSecret,
    refreshToken,
    grantType: "refresh_token",
  })

  return {
    accessToken: response.accessToken!,
    refreshToken: response.refreshToken!,
    expiresAt: new Date(response.expiresAt!),
  }
}

export const revokeToken = async (accessToken: string, environment: string) => {
  const { clientId, environment: sqEnv } = getSquareOAuthConfig(environment)

  const client = new SquareClient({ environment: sqEnv })
  await client.oAuth.revokeToken({
    clientId,
    accessToken,
  })
}
