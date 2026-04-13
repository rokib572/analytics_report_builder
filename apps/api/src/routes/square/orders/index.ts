import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import { requireActiveSquareIntegration } from "../../../middleware/require-active-square-integration"
import listOrdersRouter from "./list"
import getOrderRouter from "./get"

const ordersRouter = new Hono<AuthEnv>()
  .use(requireActiveSquareIntegration())
  .route("/list", listOrdersRouter)
  .route("/get", getOrderRouter)

export default ordersRouter
