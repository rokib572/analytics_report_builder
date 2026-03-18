import { Hono } from "hono"
import type { AuthEnv } from "../../middleware/auth"
import createRouter from "./create"
import listRouter from "./list"
import getRouter from "./get"
import toggleStatus from "./toggle-status"

const appIntegrationRouter = new Hono<AuthEnv>()
  .route("/create", createRouter)
  .route("/list", listRouter)
  .route("/get", getRouter)
  .route("/toggle-status", toggleStatus)

export default appIntegrationRouter
