import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./lib/auth"
import { authMiddleware } from "./middleware/auth"
import { errorHandler } from "./middleware/error-handler"
import onboardingRouter from "./routes/onboarding"
import squareConnectRouter from "./routes/square/connect"
import appIntegrationRouter from "./routes/app-integration"
import currentUserRouter from "./routes/users/current-user"
import listCustomersRouter from "./routes/customers/list"
import squareLocationRouter from "./routes/square/locations"
import invitationRouter from "./routes/invitations"
import validateInvitationRouter from "./routes/invitations/validate"
import usersRouter from "./routes/users/list"
import manualSyncRouter from "./routes/square/sync/manual"

const app = new Hono()
  .onError(errorHandler)
  .use(
    "*",
    cors({
      origin: "http://localhost:5173",
      allowHeaders: ["Content-Type", "Authorization", "X-Account-Id"],
      allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
      credentials: true,
    }),
  )
  .on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))
  .route("/api/invitations/validate", validateInvitationRouter)
  .use("/api/*", authMiddleware)
  .route("/api/onboarding", onboardingRouter)
  .route("/api/current-user", currentUserRouter)
  .route("/api/app-integrations", appIntegrationRouter)
  .route("/api/customers", listCustomersRouter)
  .route("/api/square/connect", squareConnectRouter)
  .route("/api/square/locations", squareLocationRouter)
  .route("/api/invitations", invitationRouter)
  .route("/api/users", usersRouter)
  .route("/api/sync/manual", manualSyncRouter)
// .route("/api/sales", salesRouter)
// .route("/api/webhooks", webhooksRouter)
// .route("/api/reports/query", reportsQueryRouter)
// .route("/api/reports", reportsListRouter)
// .route("/api/reports", reportsCreateRouter)
// .route("/api/reports", reportsGetRouter)
// .route("/api/reports", reportsRemoveRouter)

export type AppType = typeof app
export default app
