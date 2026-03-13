import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./lib/auth"
import { authMiddleware } from "./middleware/auth"
import onboardingRouter from "./routes/onboarding"

const app = new Hono()
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
// .route("/api/locations", locationsRouter)
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
