import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./lib/auth"
import { authMiddleware } from "./middleware/auth"
import { errorHandler } from "./middleware/error-handler"
import onboardingRouter from "./routes/onboarding"
import squareConnectRouter from "./routes/square/connect"
import squareOAuthRouter from "./routes/square/oauth"
import oauthCallbackRouter from "./routes/square/oauth/callback"
import appIntegrationRouter from "./routes/app-integration"
import currentUserRouter from "./routes/users/current-user"
import listCustomersRouter from "./routes/customers/list"
import squareLocationRouter from "./routes/square/locations"
import squareCustomerRouter from "./routes/square/customers"
import ordersRouter from "./routes/square/orders"
import inventoryRouter from "./routes/square/inventory"
import dailySalesRouter from "./routes/square/daily-sales"
import invitationRouter from "./routes/invitations"
import validateInvitationRouter from "./routes/invitations/validate"
import usersRouter from "./routes/users/list"
import manualSyncRouter from "./routes/square/sync/manual"
import backfillStatusRouter from "./routes/square/sync/backfill-status"
import webhooksRouter from "./routes/square/webhooks"
import syncStatusRouter from "./routes/square/sync/status"
import syncHistoryRouter from "./routes/square/sync/history"
import webhookHistoryRouter from "./routes/square/sync/webhook-history"
import reportsRouter from "./routes/square/reports/index"
import channelsRouter from "./routes/square/channels/index"
import productsRouter from "./routes/square/products/index"
import productCategoriesRouter from "./routes/square/product-categories/index"
import paymentMethodsRouter from "./routes/square/payment-methods/index"
import permissionsRouter from "./routes/permissions"
import { resolveCorsOrigin } from "./lib/allowed-origins"

const app = new Hono()
  .onError(errorHandler)
  .use(
    "*",
    cors({
      origin: resolveCorsOrigin,
      allowHeaders: ["Content-Type", "Authorization", "X-Assume-Customer-Id"],
      allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
      credentials: true,
    }),
  )
  .all("/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/invitations/validate", validateInvitationRouter)
  .route("/api/square/webhooks", webhooksRouter)
  .route("/api/square/oauth/callback", oauthCallbackRouter)
  .use("/api/*", authMiddleware)
  .route("/api/onboarding", onboardingRouter)
  .route("/api/current-user", currentUserRouter)
  .route("/api/app-integrations", appIntegrationRouter)
  .route("/api/customers", listCustomersRouter)
  .route("/api/square/connect", squareConnectRouter)
  .route("/api/square/oauth", squareOAuthRouter)
  .route("/api/square/locations", squareLocationRouter)
  .route("/api/square/customers", squareCustomerRouter)
  .route("/api/square/orders", ordersRouter)
  .route("/api/square/inventory", inventoryRouter)
  .route("/api/square/daily-sales", dailySalesRouter)
  .route("/api/invitations", invitationRouter)
  .route("/api/users", usersRouter)
  .route("/api/permissions", permissionsRouter)
  .route("/api/sync/manual", manualSyncRouter)
  .route("/api/sync/backfill-status", backfillStatusRouter)
  .route("/api/sync/status", syncStatusRouter)
  .route("/api/sync/history", syncHistoryRouter)
  .route("/api/sync/webhook-history", webhookHistoryRouter)
  .route("/api/reports", reportsRouter)
  .route("/api/square/channels", channelsRouter)
  .route("/api/square/products", productsRouter)
  .route("/api/square/product-categories", productCategoriesRouter)
  .route("/api/square/payment-methods", paymentMethodsRouter)
// .route("/api/orders", ordersRouter)
// .route("/api/webhooks", webhooksRouter)

export type AppType = typeof app
export default app
