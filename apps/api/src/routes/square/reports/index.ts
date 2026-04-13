import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import queryRouter from "./query"
import createRouter from "./create"
import listRouter from "./list"
import getRouter from "./get"
import removeRouter from "./remove"

const reportsRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/query", queryRouter)
  .route("/", createRouter)
  .route("/", listRouter)
  .route("/", getRouter)
  .route("/", removeRouter)

export default reportsRouter
