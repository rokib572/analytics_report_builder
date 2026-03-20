import { Hono } from "hono"
import type { AuthEnv } from "../../../middleware/auth"
import createSquareConnectionRouter from "./create"
import getRouter from "./get"

const squareConnectRouter = new Hono<AuthEnv>()
  .route("/square-connect", createSquareConnectionRouter)
  .route("/", getRouter)

export default squareConnectRouter
