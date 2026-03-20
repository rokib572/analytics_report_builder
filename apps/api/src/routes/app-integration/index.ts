import { Hono } from "hono"
import type { AuthEnv } from "../../middleware/auth"
import createAppIntegration from "./create"
import listAppIntegrations from "./list"
import getAppIntegrationById from "./get"
import toggleStatus from "./toggle-status"

const appIntegrationRouter = new Hono<AuthEnv>()
  .route("/create", createAppIntegration)
  .route("/list", listAppIntegrations)
  .route("/get", getAppIntegrationById)
  .route("/toggle-status", toggleStatus)

export default appIntegrationRouter
