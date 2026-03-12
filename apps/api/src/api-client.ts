import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono().use("*", cors({ origin: process.env.API_URL! }))
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
