import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./lib/auth"
import { authMiddleware } from "./middleware/auth"
import { errorHandler } from "./middleware/error-handler"
import onboardingRouter from "./routes/onboarding"
import squareConnectRouter from "./routes/square/connect"
import appIntegrationRouter from "./routes/app-integration"
import meRouter from "./routes/me"
import listCustomersRouter from "./routes/customers/list"
import squareLocationRouter from "./routes/square/locations"
import squareCustomerRouter from "./routes/square/customers"

const app = new Hono()
  .onError(errorHandler)
  .use(
    "*",
    cors({
      origin: "http://localhost:5173",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
      credentials: true,
    }),
  )
  .on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))
  .use("/api/*", authMiddleware)
  .route("/api/onboarding", onboardingRouter)
  .route("/api/me", meRouter)
  .route("/api/app-integrations", appIntegrationRouter)
  .route("/api/customers", listCustomersRouter)
  .route("/api/square/connect", squareConnectRouter)
  .route("/api/square/locations", squareLocationRouter)
  .route("/api/square/customers", squareCustomerRouter)

// .route("/api/sales", salesRouter)
// .route("/api/sync", syncRouter)
// .route("/api/webhooks", webhooksRouter)
// .route("/api/reports/query", reportsQueryRouter)
// .route("/api/reports", reportsListRouter)
// .route("/api/reports", reportsCreateRouter)
// .route("/api/reports", reportsGetRouter)
// .route("/api/reports", reportsRemoveRouter)

export type AppType = typeof app
export default app
