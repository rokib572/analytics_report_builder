import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import listOrdersRouter from "./list"
import getOrderRouter from "./get"

const ordersRouter = new Hono<AuthEnv>()
  .route("/list", listOrdersRouter)
  .route("/get", getOrderRouter)

export default ordersRouter
